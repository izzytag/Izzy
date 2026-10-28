import { toast } from "sonner";
import type { Region } from "./geo";
import { createRazorpaySubscription, verifyRazorpayPayment } from "./razorpay.functions";

export const PRO_PRICE_USD = 1;
export const PRO_PRICE_INR = 99;

/**
 * Region-aware Pro price line. Exactly ONE price per visitor — never
 * both. "loading" is the neutral placeholder while the region resolves.
 */
export function proPriceLine(region: Region | "loading"): string {
  if (region === "loading") return "Pro — monthly";
  return region === "IN" ? "₹99/month" : "$1/month";
}

/**
 * Free-for-testing switch (Izzy test phase only).
 * Set to false for live payments: Pro-only *display* behaviour is then
 * only on for real Pro subscribers (all themes available, the
 * "Made with Izzy" footer hidden), and the banner shows live pricing.
 * It does NOT override the database: the shared Supabase trigger
 * `enforce_link_limit` still caps free accounts at 5 links, and the
 * 30-day analytics range is still gated.
 *
 * Live payments (Razorpay, India) are enabled while this flag is off,
 * with live keys and the live plan configured in Vercel.
 */
export const TESTING_FREE = false;

export function testingBanner(region: Region | "loading"): string {
  // Live site: no testing wording anywhere, even if TESTING_FREE is ever flipped.
  if (region === "loading") return "Pro — monthly";
  return region === "IN" ? "Pro is ₹99/month." : "Pro is $1/month.";
}

export function effectiveIsPro(isPro: boolean): boolean {
  return isPro || TESTING_FREE;
}

type RazorpayCheckoutInstance = { open: () => void };
type RazorpayCheckoutConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

let checkoutScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout is only available in the browser."));
  const w = window as unknown as { Razorpay?: RazorpayCheckoutConstructor };
  if (w.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScriptPromise = null;
      reject(new Error("Could not load Razorpay checkout. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return checkoutScriptPromise;
}

/**
 * Pro checkout. India only, via Razorpay (₹99/month). The rest of the
 * world gets a plain "Stripe coming soon" note — no Razorpay for ROW,
 * no fake checkout. Keys are never here: the server function creates
 * the subscription and returns only the publishable key id + order id.
 */
export async function startProSubscription(opts: {
  region: Region | "loading";
  email?: string | null;
  onSuccess?: () => void;
}): Promise<void> {
  const { region, email, onSuccess } = opts;
  if (region !== "IN") {
    toast.info("Stripe checkout coming soon — Pro is $1/month.");
    return;
  }
  try {
    await loadRazorpayCheckout();
    const created = await createRazorpaySubscription({});
    if (!created.configured) {
      toast.error("Razorpay is not connected yet — add the Razorpay keys in Vercel to enable checkout.");
      return;
    }
    const w = window as unknown as { Razorpay?: RazorpayCheckoutConstructor };
    if (!w.Razorpay) {
      toast.error("Could not load Razorpay checkout. Please try again.");
      return;
    }
    const checkout = new w.Razorpay({
      key: created.key_id,
      subscription_id: created.subscription_id,
      name: "Izzy Pro",
      description: "Pro — ₹99/month",
      prefill: email ? { email } : {},
      handler: async (response: {
        razorpay_payment_id?: string;
        razorpay_subscription_id?: string;
        razorpay_signature?: string;
      }) => {
        try {
          const result = await verifyRazorpayPayment({
            data: {
              paymentId: response.razorpay_payment_id ?? "",
              subscriptionId: response.razorpay_subscription_id ?? "",
              signature: response.razorpay_signature ?? "",
            },
          });
          if (result.ok) {
            onSuccess?.();
            toast.success("You're on Pro 🎉");
          } else {
            toast.error(result.error);
          }
        } catch {
          toast.error("Could not verify this payment. Please contact support.");
        }
      },
      modal: {
        ondismiss: () => {
          // Dismissed without paying: stay on the Upgrade page, no error.
        },
      },
    });
    checkout.open();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Could not start checkout. Please try again.");
  }
}
