/**
 * Server-only Razorpay helpers. This file must never be imported by
 * client-rendered code at the top level: it reads secrets from server
 * environment variables and uses node:crypto. Server-function handlers
 * import it dynamically (await import) so it only ever runs server-side.
 *
 * Secret values are never returned, logged, or thrown in error messages.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type RazorpaySubscription = {
  id: string;
  status: string;
  notes?: Record<string, unknown> | null;
};

/** Razorpay signature: HMAC-SHA256(secret, payment_id + "|" + subscription_id). */
export function verifyRazorpaySignature(args: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  secret: string;
}): boolean {
  const { paymentId, subscriptionId, signature, secret } = args;
  if (!paymentId || !subscriptionId || !signature || !secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest();
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

function razorpayAuth(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayRequest<T>(path: string, keyId: string, keySecret: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: razorpayAuth(keyId, keySecret),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    // Never include the response body: it could echo request details.
    throw new Error("Razorpay request failed");
  }
  return (await res.json()) as T;
}

export async function createRazorpaySubscription(args: {
  keyId: string;
  keySecret: string;
  planId: string;
  userId: string;
}): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>("/subscriptions", args.keyId, args.keySecret, {
    method: "POST",
    body: JSON.stringify({
      plan_id: args.planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { user_id: args.userId },
    }),
  });
}

export async function getRazorpaySubscription(args: {
  keyId: string;
  keySecret: string;
  subscriptionId: string;
}): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${encodeURIComponent(args.subscriptionId)}`,
    args.keyId,
    args.keySecret,
    { method: "GET" },
  );
}
