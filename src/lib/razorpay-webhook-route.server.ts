/**
 * Thin HTTP adapter for the Razorpay webhook. Kept separate from the
 * handler so the handler stays unit-testable without Request/env.
 *
 * Reads the RAW body (request.text()) — the signature only verifies
 * against the exact bytes Razorpay sent. Returns JSON with no secret,
 * signature, or payload content.
 */
import { handleRazorpayWebhook, realWebhookDeps } from "./razorpay-webhook.server";

export async function handleRazorpayWebhookRequest(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const env = {
      webhookSecret: process.env["RAZORPAY_WEBHOOK_SECRET"] ?? "",
      keyId: process.env["RAZORPAY_KEY_ID"] ?? "",
      keySecret: process.env["RAZORPAY_KEY_SECRET"] ?? "",
    };
    const outcome = await handleRazorpayWebhook(
      { rawBody, signature, env },
      realWebhookDeps({ keyId: env.keyId, keySecret: env.keySecret }),
    );
    return Response.json(
      { ok: outcome.httpStatus === 200, action: outcome.action },
      { status: outcome.httpStatus },
    );
  } catch {
    // Fail closed, never crash the server entry.
    return Response.json({ ok: false, action: "retry" }, { status: 500 });
  }
}
