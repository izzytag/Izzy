import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Razorpay checkout for India only (₹99/month Pro). No Stripe here.
 *
 * Keys live only as Vercel server environment variables, set by the site
 * owner: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID_INR
 * (a ₹99/month INR plan created once in the Razorpay dashboard, Test
 * Mode first). When any of them is missing, creation returns
 * { configured: false } and the client shows a plain "not connected"
 * message — it never throws secrets or stack traces to the browser.
 *
 * The paying user is identified from the validated session token
 * (requireSupabaseAuth), never from a client-supplied user_id. A payment
 * is only activated after BOTH checks pass: the Razorpay subscription
 * fetched from Razorpay belongs to this user (notes.user_id), and the
 * HMAC signature verifies with the server secret. Renewals and the
 * final end of a cancelled subscription arrive via the Razorpay
 * webhook (razorpay-webhook.server.ts); cancellation is below.
 */

type RazorpayEnv = {
  keyId: string;
  keySecret: string;
  planId: string;
};

function razorpayEnv(): RazorpayEnv | null {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  const planId = process.env["RAZORPAY_PLAN_ID_INR"];
  if (!keyId || !keySecret || !planId) return null;
  return { keyId, keySecret, planId };
}

export const createRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const env = razorpayEnv();
    if (!env) return { configured: false as const };
    const { createRazorpaySubscription: create } = await import("./razorpay.server");
    try {
      const subscription = await create({
        keyId: env.keyId,
        keySecret: env.keySecret,
        planId: env.planId,
        userId: context.userId,
      });
      // key_id is the publishable id — safe to return. The secret never is.
      return { configured: true as const, subscription_id: subscription.id, key_id: env.keyId };
    } catch {
      throw new Error("Could not start Razorpay checkout. Please try again.");
    }
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { paymentId: string; subscriptionId: string; signature: string }) => ({
    paymentId: String(d.paymentId ?? ""),
    subscriptionId: String(d.subscriptionId ?? ""),
    signature: String(d.signature ?? ""),
  }))
  .handler(async ({ context, data }) => {
    const env = razorpayEnv();
    if (!env) return { ok: false as const, error: "Razorpay is not connected yet." };
    if (!data.paymentId || !data.subscriptionId || !data.signature) {
      return { ok: false as const, error: "Payment details are incomplete." };
    }
    const { getRazorpaySubscription, verifyRazorpaySignature } = await import("./razorpay.server");
    let subscription;
    try {
      subscription = await getRazorpaySubscription({
        keyId: env.keyId,
        keySecret: env.keySecret,
        subscriptionId: data.subscriptionId,
      });
    } catch {
      return { ok: false as const, error: "Could not verify this payment. Please contact support." };
    }
    // The subscription must belong to the authenticated caller.
    if (subscription.notes?.user_id !== context.userId) {
      return { ok: false as const, error: "This payment does not belong to your account." };
    }
    if (subscription.status !== "active" && subscription.status !== "authenticated") {
      return { ok: false as const, error: "This subscription is not active yet." };
    }
    const valid = verifyRazorpaySignature({
      paymentId: data.paymentId,
      subscriptionId: data.subscriptionId,
      signature: data.signature,
      secret: env.keySecret,
    });
    if (!valid) {
      return { ok: false as const, error: "Payment verification failed." };
    }
    // Verified payment only: activate Pro for one month from now. The
    // service-role client is used because the subscriptions row is
    // server-managed (RLS does not grant the browser this write); it is
    // only reached after auth + ownership + signature checks above.
    // SUPABASE_SERVICE_ROLE_KEY is therefore a required server env var.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        plan: "pro",
        status: "active",
        razorpay_subscription_id: data.subscriptionId,
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      return { ok: false as const, error: "Payment verified, but Pro could not be activated. Please contact support." };
    }
    return { ok: true as const };
  });

/**
 * Cancel the caller's own Pro subscription at cycle end. The caller is
 * identified from the validated session token; the subscription that
 * gets cancelled is the one stored on THEIR subscriptions row, and a
 * fresh fetch from Razorpay must confirm it belongs to them
 * (notes.user_id) before anything is cancelled.
 *
 * Nothing is written to the local subscriptions row here: the row
 * stays "active" (Pro genuinely stays on until the paid-through
 * date), Razorpay ends the subscription at cycle end and fires
 * subscription.cancelled, and the webhook then marks the row
 * cancelled. Even if that webhook were delayed, is_pro() and the
 * account query both stop Pro at current_period_end.
 */
export const cancelProSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }) => {
    const env = razorpayEnv();
    if (!env) {
      return {
        ok: false as const,
        configured: false as const,
        error: "Razorpay is not connected yet — cancellation isn't available here right now. Please contact support.",
      };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("subscriptions")
      .select("plan, status, razorpay_subscription_id, current_period_end")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row || row.plan !== "pro" || !row.razorpay_subscription_id) {
      return {
        ok: false as const,
        configured: true as const,
        error: "There's no Razorpay subscription on this account to cancel.",
      };
    }
    const subscriptionId = row.razorpay_subscription_id;
    const { getRazorpaySubscription, cancelRazorpaySubscription, cancellationDecision } =
      await import("./razorpay.server");
    let fetched;
    try {
      fetched = await getRazorpaySubscription({
        keyId: env.keyId,
        keySecret: env.keySecret,
        subscriptionId,
      });
    } catch {
      return {
        ok: false as const,
        configured: true as const,
        error: "Could not reach Razorpay to cancel. Please try again.",
      };
    }
    // The subscription must belong to the authenticated caller.
    if (fetched.notes?.["user_id"] !== context.userId) {
      return {
        ok: false as const,
        configured: true as const,
        error: "This subscription does not belong to your account.",
      };
    }
    const decision = cancellationDecision(fetched.status);
    if (decision === "already_ended") {
      return {
        ok: true as const,
        configured: true as const,
        alreadyEnded: true as const,
        periodEnd: row.current_period_end ?? null,
      };
    }
    if (decision === "unavailable") {
      return {
        ok: false as const,
        configured: true as const,
        error: "This subscription isn't in a state that can be cancelled right now. Please contact support.",
      };
    }
    let cancelled;
    try {
      cancelled = await cancelRazorpaySubscription({
        keyId: env.keyId,
        keySecret: env.keySecret,
        subscriptionId,
      });
    } catch {
      return {
        ok: false as const,
        configured: true as const,
        error: "Could not cancel this subscription. Please try again.",
      };
    }
    // The paid-through date: prefer Razorpay's own current_end (from
    // the cancel response, then the earlier fetch) over the stored
    // row — never an invented date.
    const fromRazorpay = cancelled.current_end ?? fetched.current_end;
    const periodEnd =
      typeof fromRazorpay === "number" && Number.isFinite(fromRazorpay)
        ? new Date(fromRazorpay * 1000).toISOString()
        : (row.current_period_end ?? null);
    return {
      ok: true as const,
      configured: true as const,
      alreadyEnded: false as const,
      periodEnd,
    };
  });
