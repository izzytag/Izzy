import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { accountQuery } from "@/lib/account";
import {
  proPriceLine,
  startProSubscription,
  planDisplayState,
  requestProCancellation,
} from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { PricingCards } from "@/components/PricingCards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/upgrade")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: UpgradePage,
});

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function stateLabel(state: ReturnType<typeof planDisplayState>): string {
  switch (state.kind) {
    case "free":
      return "Free";
    case "active":
      return "Active";
    case "expired":
      return "Ended";
    case "cancelled":
      return "Cancelled";
    case "other":
      return state.status;
  }
}

/**
 * Plan & billing — the subscription section. Everything shown comes
 * from the caller's own subscriptions row (plan, status, period end,
 * Razorpay reference) plus the plan definitions in billing.ts.
 * Cancellation goes through the server function, which re-verifies
 * ownership with Razorpay and cancels at cycle end; this page never
 * marks a subscription cancelled itself.
 */
function UpgradePage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const region = useRegion();
  const isRow = region === "ROW";
  const sub = acc.sub;
  const state = planDisplayState(sub);
  const [cancelling, setCancelling] = useState(false);
  const [cancelScheduled, setCancelScheduled] = useState<{ periodEnd: string | null } | null>(null);

  async function handleCancel() {
    setCancelling(true);
    const result = await requestProCancellation();
    setCancelling(false);
    if (!result.ok) return; // the wrapper already toasted the reason
    setCancelScheduled({ periodEnd: result.periodEnd });
    void qc.invalidateQueries({ queryKey: ["account"] });
    toast.success(
      result.alreadyEnded
        ? "Your Pro subscription has already ended — there will be no further charges."
        : "Cancellation scheduled — Pro stays active until your paid period ends.",
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Plan &amp; billing</h1>
        <p className="mt-1 text-muted-foreground">
          {proPriceLine(region)}, cancel anytime. {isRow ? "Stripe checkout coming soon." : "Card, UPI, or netbanking at checkout."}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">Your plan</h2>
          {state.kind === "free" ? (
            <Badge variant="secondary">Free</Badge>
          ) : (
            <>
              <Badge>Pro</Badge>
              <Badge variant="secondary">{stateLabel(state)}</Badge>
            </>
          )}
        </div>

        {state.kind === "free" && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            You&apos;re on the <span className="font-medium text-foreground">Free plan</span> — up to 5 products
            &amp; services, the Light and Dark themes, and 7-day analytics. Pro gives you unlimited products
            &amp; services, all 8 themes, no izzy branding and 30-day analytics.
          </p>
        )}

        {state.kind === "active" && (
          <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>
              You&apos;re on <span className="font-medium text-foreground">izzy Pro</span> ({proPriceLine(region)}) —
              unlimited products &amp; services, all themes, no izzy branding, 30-day analytics.
            </p>
            {state.periodEnd ? (
              <p>
                Your subscription <span className="font-medium text-foreground">renews on {fmtDate(state.periodEnd)}</span> —
                Razorpay charges automatically each month until you cancel.
              </p>
            ) : (
              <p>Your subscription renews automatically each month until you cancel.</p>
            )}
            {cancelScheduled ? (
              <p className="rounded-xl bg-primary-soft p-3 font-medium text-accent-foreground">
                Cancellation scheduled. Pro stays active until{" "}
                {cancelScheduled.periodEnd ? fmtDate(cancelScheduled.periodEnd) : "the end of your paid period"},
                then your shop moves to Free. Nothing is deleted, and Razorpay won&apos;t charge you again.
              </p>
            ) : sub?.razorpay_subscription_id ? (
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="min-h-[44px]">Cancel subscription</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Pro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your Pro stays active until{" "}
                        {state.periodEnd ? fmtDate(state.periodEnd) : "the end of your current paid period"} —
                        Razorpay won&apos;t charge you again after that. When it ends, your shop moves to Free:
                        everything stays and nothing is deleted, but if you have more than 5 products &amp;
                        services you won&apos;t be able to add new ones until you&apos;re under the Free limit
                        or back on Pro. There&apos;s no refund for the current period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="min-h-[44px]">Keep Pro</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handleCancel()} disabled={cancelling} className="min-h-[44px]">
                        {cancelling ? "Cancelling…" : "Yes, cancel at period end"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <p>
                This Pro was set up without Razorpay checkout, so there&apos;s no subscription to cancel
                here — contact us if you need changes.
              </p>
            )}
          </div>
        )}

        {state.kind === "expired" && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Your Pro ended{state.periodEnd ? <> on <span className="font-medium text-foreground">{fmtDate(state.periodEnd)}</span></> : ""}.
            You&apos;re on the Free plan now — your shop and products are unchanged, and you can upgrade again below.
          </p>
        )}

        {state.kind === "cancelled" && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Your Pro subscription was cancelled
            {state.periodEnd ? <> — your last paid period ended <span className="font-medium text-foreground">{fmtDate(state.periodEnd)}</span></> : ""}.
            You&apos;re on the Free plan now, and you can upgrade again below.
          </p>
        )}

        {state.kind === "other" && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Your Pro subscription status is <span className="font-medium text-foreground">{state.status}</span>
            {state.periodEnd ? <> — current paid period ends <span className="font-medium text-foreground">{fmtDate(state.periodEnd)}</span></> : ""}.
            If something looks wrong, contact us and we&apos;ll check.
          </p>
        )}
      </section>

      {state.kind !== "free" && (
        <section className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 className="text-xl font-bold">What happens when Pro ends</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
            <li>Your products, services and shop stay exactly as they are — <span className="font-medium text-foreground">nothing is ever deleted</span>.</li>
            <li>If you have more than 5 products &amp; services, they all stay live — you just can&apos;t add new ones until you&apos;re under the Free limit or back on Pro.</li>
            <li>Pro themes stop applying and your shop falls back to the Light theme (Light and Dark are free), and the &quot;Made with Izzy&quot; footer returns.</li>
            <li>Analytics goes back to the last 7 days.</li>
          </ul>
        </section>
      )}

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Billing history</h2>
        {sub?.plan === "pro" ? (
          <>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Plan</dt>
                <dd className="text-base font-medium">izzy Pro</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="text-base font-medium">{stateLabel(state)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Amount</dt>
                <dd className="text-base font-medium">{sub.razorpay_subscription_id ? "₹99/month" : "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Current period end</dt>
                <dd className="text-base font-medium">{sub.current_period_end ? fmtDate(sub.current_period_end) : "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Subscription reference</dt>
                <dd className="break-all text-base font-medium">{sub.razorpay_subscription_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Last updated</dt>
                <dd className="text-base font-medium">{fmtDate(sub.updated_at)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              This is your current subscription record — izzy keeps one per shop. Each monthly charge is made
              by Razorpay, which emails your payment receipt; izzy doesn&apos;t generate invoices.
            </p>
          </>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            No billing history yet — you&apos;re on the Free plan, and there&apos;s nothing to show until you upgrade.
          </p>
        )}
      </section>

      {isRow && !acc.isPro && (
        <p className="rounded-xl border p-3 text-base text-muted-foreground">Stripe checkout coming soon — Pro is $1/month. Razorpay checkout is for India only.</p>
      )}
      <div>
        <PricingCards
          region={region}
          freeCta={<Button variant="outline" disabled className="min-h-[52px] w-full rounded-xl text-base">{acc.isPro ? "Free plan" : "Current plan"}</Button>}
          proCta={acc.isPro
            ? <Button disabled className="min-h-[52px] w-full rounded-xl text-base">Current plan</Button>
            : isRow
              ? <Button disabled className="min-h-[52px] w-full rounded-xl text-lg">Stripe checkout coming soon</Button>
              : <Button onClick={() => void startProSubscription({ region, email: acc.user.email ?? null, onSuccess: () => void qc.invalidateQueries({ queryKey: ["account"] }) })} className="min-h-[52px] w-full rounded-xl text-lg">Upgrade ({proPriceLine(region)})</Button>}
        />
      </div>
    </div>
  );
}
