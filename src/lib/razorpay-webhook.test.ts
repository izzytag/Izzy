import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  verifyWebhookSignature,
  webhookActionForEvent,
  parseWebhookPayload,
  handleRazorpayWebhook,
  type WebhookDeps,
  type FetchedSubscription,
} from "./razorpay-webhook.server";
import { handleRazorpayWebhookRequest } from "./razorpay-webhook-route.server";

// Placeholder values only — never real keys, secrets, or plan ids.
const SECRET = "whsec_test_placeholder";
const OTHER_SECRET = "whsec_other_placeholder";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function chargedBody(subscriptionId = "sub_webhook123"): string {
  return JSON.stringify({
    event: "subscription.charged",
    payload: { subscription: { entity: { id: subscriptionId } } },
  });
}

// Known vector, computed with node:crypto HMAC-SHA256:
// secret "whsec_test_placeholder", body chargedBody("sub_webhook123").
const KNOWN_BODY = chargedBody("sub_webhook123");
const KNOWN_SIGNATURE = "48e2be2f8f422abad624dbf4d0b28c110ddc53c1d395e91d12ed93acc6545641";

function fakeDeps(overrides: Partial<WebhookDeps> = {}): WebhookDeps & {
  calls: { upserts: Array<{ userId: string; subscriptionId: string; periodEnd: string }>; cancels: string[] };
  fetched: FetchedSubscription;
} {
  const calls = { upserts: [] as Array<{ userId: string; subscriptionId: string; periodEnd: string }>, cancels: [] as string[] };
  const fetched: FetchedSubscription = {
    id: "sub_webhook123",
    status: "active",
    notes: { user_id: "user_abc" },
    current_end: 1735689600, // 2025-01-01T00:00:00.000Z
  };
  return {
    calls,
    fetched,
    getSubscription: vi.fn(async () => fetched),
    getExistingPeriodEnd: vi.fn(async () => null),
    upsertActive: vi.fn(async (args) => {
      calls.upserts.push(args);
    }),
    markCancelled: vi.fn(async (subscriptionId) => {
      calls.cancels.push(subscriptionId);
    }),
    ...overrides,
  };
}

const ENV = { webhookSecret: SECRET, keyId: "key_test_placeholder", keySecret: "secret_test_placeholder" };

describe("verifyWebhookSignature", () => {
  it("accepts the known-good signature over the raw body", () => {
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: KNOWN_SIGNATURE, secret: SECRET })).toBe(true);
  });
  it("rejects a tampered signature", () => {
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: "00".repeat(32), secret: SECRET })).toBe(false);
  });
  it("rejects the right signature under the wrong secret", () => {
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: KNOWN_SIGNATURE, secret: OTHER_SECRET })).toBe(false);
  });
  it("rejects non-hex or wrong-length signatures without throwing", () => {
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: "not-hex!!", secret: SECRET })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: "abcd", secret: SECRET })).toBe(false);
  });
  it("rejects empty inputs", () => {
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: KNOWN_SIGNATURE, secret: "" })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: KNOWN_BODY, signature: "", secret: SECRET })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: "", signature: KNOWN_SIGNATURE, secret: SECRET })).toBe(false);
  });
  it("rejects a signature over re-serialised JSON that differs from the raw body", () => {
    const pretty = JSON.stringify(JSON.parse(KNOWN_BODY) as unknown, null, 2);
    expect(pretty).not.toBe(KNOWN_BODY);
    expect(verifyWebhookSignature({ rawBody: pretty, signature: KNOWN_SIGNATURE, secret: SECRET })).toBe(false);
  });
});

describe("parseWebhookPayload", () => {
  it("extracts event + subscription id", () => {
    expect(parseWebhookPayload(KNOWN_BODY)).toEqual({ event: "subscription.charged", subscriptionId: "sub_webhook123" });
  });
  it("returns null for malformed JSON, non-objects, and missing ids", () => {
    expect(parseWebhookPayload("{not json")).toBeNull();
    expect(parseWebhookPayload("[1,2]")).toBeNull();
    expect(parseWebhookPayload(JSON.stringify({ event: "subscription.charged" }))).toBeNull();
    expect(parseWebhookPayload(JSON.stringify({ payload: { subscription: { entity: { id: "sub_x" } } } }))).toBeNull();
  });
});

describe("webhookActionForEvent", () => {
  it("maps charged/activated to activate, cancelled/completed to cancel, everything else to ignore", () => {
    expect(webhookActionForEvent("subscription.charged")).toBe("activate");
    expect(webhookActionForEvent("subscription.activated")).toBe("activate");
    expect(webhookActionForEvent("subscription.cancelled")).toBe("cancel");
    expect(webhookActionForEvent("subscription.completed")).toBe("cancel");
    expect(webhookActionForEvent("subscription.created")).toBe("ignore");
    expect(webhookActionForEvent("payment.captured")).toBe("ignore");
    expect(webhookActionForEvent("something.else")).toBe("ignore");
  });
});

describe("handleRazorpayWebhook", () => {
  it("rejects a missing webhook secret without calling any dependency", async () => {
    const deps = fakeDeps();
    const out = await handleRazorpayWebhook(
      { rawBody: KNOWN_BODY, signature: KNOWN_SIGNATURE, env: { ...ENV, webhookSecret: "" } },
      deps,
    );
    expect(out.httpStatus).toBe(500);
    expect(deps.getSubscription).not.toHaveBeenCalled();
  });
  it("rejects a missing or invalid signature without re-fetching", async () => {
    const deps = fakeDeps();
    const missing = await handleRazorpayWebhook({ rawBody: KNOWN_BODY, signature: "", env: ENV }, deps);
    expect(missing.httpStatus).toBe(401);
    const bad = await handleRazorpayWebhook({ rawBody: KNOWN_BODY, signature: "00".repeat(32), env: ENV }, deps);
    expect(bad.httpStatus).toBe(401);
    expect(deps.getSubscription).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON with a valid signature over that exact body", async () => {
    const deps = fakeDeps();
    const body = "{not json";
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(out.httpStatus).toBe(400);
    expect(deps.getSubscription).not.toHaveBeenCalled();
  });
  it("acknowledges unhandled events without re-fetching", async () => {
    const deps = fakeDeps();
    const body = JSON.stringify({ event: "payment.captured", payload: { subscription: { entity: { id: "sub_webhook123" } } } });
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(out).toMatchObject({ httpStatus: 200, action: "ignored" });
    expect(deps.getSubscription).not.toHaveBeenCalled();
  });
  it("activates Pro from Razorpay current_end, and repeats write the same period end (idempotent)", async () => {
    const deps = fakeDeps();
    const body = chargedBody();
    const first = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    const second = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(first).toMatchObject({ httpStatus: 200, action: "activated" });
    expect(second).toMatchObject({ httpStatus: 200, action: "activated" });
    expect(deps.calls.upserts).toEqual([
      { userId: "user_abc", subscriptionId: "sub_webhook123", periodEnd: "2025-01-01T00:00:00.000Z" },
      { userId: "user_abc", subscriptionId: "sub_webhook123", periodEnd: "2025-01-01T00:00:00.000Z" },
    ]);
  });
  it("keeps the existing period end when Razorpay gives no current_end", async () => {
    const deps = fakeDeps();
    deps.fetched.current_end = null;
    deps.getExistingPeriodEnd = vi.fn(async () => "2025-02-01T00:00:00.000Z");
    const body = chargedBody();
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(out).toMatchObject({ httpStatus: 200, action: "activated" });
    expect(deps.calls.upserts).toEqual([
      { userId: "user_abc", subscriptionId: "sub_webhook123", periodEnd: "2025-02-01T00:00:00.000Z" },
    ]);
  });
  it("does not write when there is no period end at all and no existing row", async () => {
    const deps = fakeDeps();
    deps.fetched.current_end = null;
    const body = chargedBody();
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(out).toMatchObject({ httpStatus: 200, action: "ignored" });
    expect(deps.calls.upserts).toEqual([]);
  });
  it("does not write when the fetched subscription has no Izzy user in notes", async () => {
    const deps = fakeDeps();
    deps.fetched.notes = {};
    const body = chargedBody();
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(out).toMatchObject({ httpStatus: 200, action: "ignored" });
    expect(deps.calls.upserts).toEqual([]);
  });
  it("does not activate when the fetched status does not confirm it", async () => {
    const deps = fakeDeps();
    deps.fetched.status = "halted";
    const body = chargedBody();
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, deps);
    expect(out).toMatchObject({ httpStatus: 200, action: "ignored" });
    expect(deps.calls.upserts).toEqual([]);
  });
  it("cancels when Razorpay confirms cancelled, and leaves Pro alone while still active", async () => {
    const cancelledBody = JSON.stringify({
      event: "subscription.cancelled",
      payload: { subscription: { entity: { id: "sub_webhook123" } } },
    });
    const deps = fakeDeps();
    deps.fetched.status = "cancelled";
    const out = await handleRazorpayWebhook({ rawBody: cancelledBody, signature: sign(cancelledBody), env: ENV }, deps);
    expect(out).toMatchObject({ httpStatus: 200, action: "cancelled" });
    expect(deps.calls.cancels).toEqual(["sub_webhook123"]);

    const stillActive = fakeDeps();
    stillActive.fetched.status = "active";
    const out2 = await handleRazorpayWebhook({ rawBody: cancelledBody, signature: sign(cancelledBody), env: ENV }, stillActive);
    expect(out2).toMatchObject({ httpStatus: 200, action: "ignored" });
    expect(stillActive.calls.cancels).toEqual([]);
  });
  it("retries (non-200) when the re-fetch or the write fails", async () => {
    const fetchFails = fakeDeps({ getSubscription: vi.fn(async () => { throw new Error("down"); }) });
    const body = chargedBody();
    const out = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, fetchFails);
    expect(out.httpStatus).toBe(502);
    expect(fetchFails.calls.upserts).toEqual([]);

    const writeFails = fakeDeps({ upsertActive: vi.fn(async () => { throw new Error("db down"); }) });
    const out2 = await handleRazorpayWebhook({ rawBody: body, signature: sign(body), env: ENV }, writeFails);
    expect(out2.httpStatus).toBe(500);
  });
});

describe("handleRazorpayWebhookRequest (route adapter)", () => {
  const OLD = { ...process.env };
  beforeEach(() => {
    process.env["RAZORPAY_WEBHOOK_SECRET"] = SECRET;
    process.env["RAZORPAY_KEY_ID"] = "key_test_placeholder";
    process.env["RAZORPAY_KEY_SECRET"] = "secret_test_placeholder";
  });
  afterEach(() => {
    process.env = { ...OLD };
  });

  it("returns 401 without a signature and 200-ignored for unhandled events", async () => {
    const noSig = await handleRazorpayWebhookRequest(
      new Request("http://localhost/api/razorpay-webhook", { method: "POST", body: KNOWN_BODY }),
    );
    expect(noSig.status).toBe(401);

    const body = JSON.stringify({ event: "payment.captured", payload: { subscription: { entity: { id: "sub_webhook123" } } } });
    const ignored = await handleRazorpayWebhookRequest(
      new Request("http://localhost/api/razorpay-webhook", {
        method: "POST",
        body,
        headers: { "x-razorpay-signature": sign(body) },
      }),
    );
    expect(ignored.status).toBe(200);
    expect(await ignored.json()).toEqual({ ok: true, action: "ignored" });
  });
});
