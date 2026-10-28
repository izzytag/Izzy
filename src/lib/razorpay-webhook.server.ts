/**
 * Server-only Razorpay webhook handler. This file must never be imported
 * by client-rendered code: it reads the webhook secret from a server
 * environment variable and uses node:crypto.
 *
 * Security rules (fail closed, never crash, never leak):
 * - The signature is verified against the RAW request body, never
 *   re-serialised JSON. Razorpay sends
 *   x-razorpay-signature = hex(HMAC-SHA256(webhook_secret, raw_body)).
 * - Missing webhook secret, missing/invalid signature, or malformed
 *   JSON is rejected with a non-200 status.
 * - Nothing from the payload is ever trusted for writes: the handler
 *   re-fetches the subscription from Razorpay (server key/secret) and
 *   only writes when the fetched subscription's notes.user_id identifies
 *   an Izzy user and its status confirms the event.
 * - The period end always comes from Razorpay's current_end (Unix
 *   seconds) — never Date.now() + 30 days — so a retried delivery
 *   writes the same value again (idempotent).
 * - Logs contain only the event name and outcome. Secrets, signatures
 *   and payloads are never logged, returned, or thrown.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import type { RazorpaySubscription } from "./razorpay.server";

export type WebhookAction = "activate" | "cancel" | "ignore";

export type WebhookOutcome = {
  /** HTTP status the route should return. Non-200 makes Razorpay retry. */
  httpStatus: 200 | 400 | 401 | 500 | 502;
  action: "activated" | "cancelled" | "ignored" | "rejected" | "retry";
  /** Generic reason code for logs only — never a secret or payload. */
  reason: string;
};

export type WebhookEnv = {
  webhookSecret: string;
  keyId: string;
  keySecret: string;
};

export type FetchedSubscription = RazorpaySubscription & {
  current_end?: number | null;
};

export type WebhookDeps = {
  getSubscription: (subscriptionId: string) => Promise<FetchedSubscription>;
  getExistingPeriodEnd: (userId: string) => Promise<string | null>;
  upsertActive: (args: { userId: string; subscriptionId: string; periodEnd: string }) => Promise<void>;
  markCancelled: (subscriptionId: string) => Promise<void>;
};

/** Hex HMAC-SHA256 of the raw body. Constant-time comparison. */
export function verifyWebhookSignature(args: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  const { rawBody, signature, secret } = args;
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  try {
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function webhookActionForEvent(event: string): WebhookAction {
  switch (event) {
    case "subscription.charged":
    case "subscription.activated":
      return "activate";
    case "subscription.cancelled":
    case "subscription.completed":
      return "cancel";
    default:
      return "ignore";
  }
}

export function parseWebhookPayload(rawBody: string): { event: string; subscriptionId: string } | null {
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
  if (payload === null || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const event = record["event"];
  if (typeof event !== "string" || event.length === 0) return null;
  const entity = (record["payload"] as Record<string, unknown> | undefined)?.["subscription"] as
    | Record<string, unknown>
    | undefined;
  const id = (entity?.["entity"] as Record<string, unknown> | undefined)?.["id"];
  if (typeof id !== "string" || id.length === 0) return null;
  return { event, subscriptionId: id };
}

function rejected(httpStatus: 400 | 401 | 500 | 502, reason: string): WebhookOutcome {
  return { httpStatus, action: httpStatus === 502 || httpStatus === 500 ? "retry" : "rejected", reason };
}

export async function handleRazorpayWebhook(
  args: { rawBody: string; signature: string; env: WebhookEnv },
  deps: WebhookDeps,
): Promise<WebhookOutcome> {
  const { rawBody, signature, env } = args;
  if (!env.webhookSecret) {
    console.warn("[razorpay-webhook] rejected: webhook secret not configured");
    return rejected(500, "webhook_not_configured");
  }
  if (!signature) {
    console.warn("[razorpay-webhook] rejected: missing signature");
    return rejected(401, "missing_signature");
  }
  if (!verifyWebhookSignature({ rawBody, signature, secret: env.webhookSecret })) {
    console.warn("[razorpay-webhook] rejected: invalid signature");
    return rejected(401, "invalid_signature");
  }
  const parsed = parseWebhookPayload(rawBody);
  if (!parsed) {
    console.warn("[razorpay-webhook] rejected: malformed payload");
    return rejected(400, "malformed_payload");
  }
  const action = webhookActionForEvent(parsed.event);
  if (action === "ignore") {
    return { httpStatus: 200, action: "ignored", reason: `unhandled_event:${parsed.event}` };
  }
  if (!env.keyId || !env.keySecret) {
    console.warn("[razorpay-webhook] retry: Razorpay API credentials not configured");
    return rejected(500, "api_not_configured");
  }
  let fetched: FetchedSubscription;
  try {
    fetched = await deps.getSubscription(parsed.subscriptionId);
  } catch {
    // Transient: let Razorpay retry the delivery.
    console.warn("[razorpay-webhook] retry: could not re-fetch subscription");
    return rejected(502, "fetch_failed");
  }
  const userId = fetched.notes?.user_id;
  if (typeof userId !== "string" || userId.length === 0) {
    // A subscription without an Izzy user in notes was not created by
    // Izzy checkout; there is nobody to activate or cancel.
    console.warn("[razorpay-webhook] ignored: subscription has no Izzy user");
    return { httpStatus: 200, action: "ignored", reason: "no_owner" };
  }
  if (action === "activate") {
    if (fetched.status !== "active" && fetched.status !== "authenticated") {
      console.warn("[razorpay-webhook] ignored: fetched status does not confirm activation");
      return { httpStatus: 200, action: "ignored", reason: "status_not_active" };
    }
    let periodEnd: string | null = null;
    if (typeof fetched.current_end === "number" && Number.isFinite(fetched.current_end)) {
      periodEnd = new Date(fetched.current_end * 1000).toISOString();
    } else {
      // Razorpay gave no period end: keep the row's existing one rather
      // than inventing a date. If there is no row yet, do not write.
      periodEnd = await deps.getExistingPeriodEnd(userId);
    }
    if (!periodEnd) {
      console.warn("[razorpay-webhook] ignored: no period end available");
      return { httpStatus: 200, action: "ignored", reason: "no_period_end" };
    }
    try {
      await deps.upsertActive({ userId, subscriptionId: parsed.subscriptionId, periodEnd });
    } catch {
      console.warn("[razorpay-webhook] retry: could not write subscription");
      return rejected(500, "write_failed");
    }
    return { httpStatus: 200, action: "activated", reason: `event:${parsed.event}` };
  }
  // action === "cancel"
  if (fetched.status !== "cancelled" && fetched.status !== "completed" && fetched.status !== "expired") {
    // e.g. cancel-at-cycle-end: the subscription is still paid up, so
    // Pro stays on until Razorpay actually ends it (a later event).
    console.warn("[razorpay-webhook] ignored: fetched status is still active");
    return { httpStatus: 200, action: "ignored", reason: "status_still_active" };
  }
  try {
    await deps.markCancelled(parsed.subscriptionId);
  } catch {
    console.warn("[razorpay-webhook] retry: could not write subscription");
    return rejected(500, "write_failed");
  }
  return { httpStatus: 200, action: "cancelled", reason: `event:${parsed.event}` };
}

/**
 * Real dependencies, wired to Razorpay + the service-role Supabase
 * client. Supabase is imported dynamically so this module stays light
 * for unit tests (which inject fake deps instead).
 */
export function realWebhookDeps(env: { keyId: string; keySecret: string }): WebhookDeps {
  return {
    getSubscription: async (subscriptionId: string) => {
      const { getRazorpaySubscription } = await import("./razorpay.server");
      return getRazorpaySubscription({ keyId: env.keyId, keySecret: env.keySecret, subscriptionId });
    },
    getExistingPeriodEnd: async (userId: string) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("current_period_end")
        .eq("user_id", userId)
        .maybeSingle();
      return (data?.current_period_end as string | null) ?? null;
    },
    upsertActive: async ({ userId, subscriptionId, periodEnd }) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          status: "active",
          razorpay_subscription_id: subscriptionId,
          current_period_end: periodEnd,
        },
        { onConflict: "user_id" },
      );
      if (error) throw new Error("Supabase upsert failed");
    },
    markCancelled: async (subscriptionId: string) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("razorpay_subscription_id", subscriptionId);
      if (error) throw new Error("Supabase update failed");
    },
  };
}
