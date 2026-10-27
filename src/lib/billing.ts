import { toast } from "sonner";

export const PRO_PRICE_USD = 1;
export const PRO_PRICE_INR = 99;
export const PRO_PRICE_DISPLAY = "$1";
/** Izzy-only pricing, shown as-is — no geo-detection. India sees ₹99, everyone else sees $1. */
export const PRO_PRICE_DISPLAY_LINE = "₹99/month in India · $1/month elsewhere";

/**
 * Free-for-testing switch (Izzy test phase only).
 * Flip to false when the Pro paywall returns. While true, Pro-only
 * *display* behaviour is on for everyone: all themes are available and
 * the "Made with Izzy" footer is hidden, and the testing banner is shown.
 * It does NOT override the database: the shared Supabase trigger
 * `enforce_link_limit` still caps free accounts at 5 links, and the
 * 30-day analytics range is still gated, until a separate Izzy Supabase
 * project is set up (see docs/izzy-supabase.md). Do not delete the Pro
 * code — it is only gated behind this flag.
 */
export const TESTING_FREE = true;
export const TESTING_BANNER =
  "Free during testing — Pro will be ₹99/month in India / $1/month elsewhere.";
export function effectiveIsPro(isPro: boolean): boolean {
  return isPro || TESTING_FREE;
}

/**
 * Placeholder for Pro subscriptions.
 * TODO: create a Stripe subscription (outside India) / Razorpay subscription (India)
 * in a server function, and update public.subscriptions (plan='pro', current_period_end)
 * from a verified webhook. Payment keys live only as environment variables, never in code.
 */
export async function startProSubscription() {
  toast.info("Payments are coming soon — Pro checkout will open here once Stripe/Razorpay are connected.");
}
