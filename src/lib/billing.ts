import { toast } from "sonner";

export const PRO_PRICE_USD = 1;
export const PRO_PRICE_DISPLAY = "$1";

/**
 * Placeholder for Pro subscriptions.
 * TODO: create a Stripe subscription (outside India) / Razorpay subscription (India)
 * in a server function, and update public.subscriptions (plan='pro', current_period_end)
 * from a verified webhook. Payment keys live only as environment variables, never in code.
 */
export async function startProSubscription() {
  toast.info("Payments are coming soon — Pro checkout will open here once Stripe/Razorpay are connected.");
}
