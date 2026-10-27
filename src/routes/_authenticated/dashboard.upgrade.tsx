import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { accountQuery } from "@/lib/account";
import { proPriceLine, testingBanner, startProSubscription } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { PricingCards } from "@/components/PricingCards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/upgrade")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: UpgradePage,
});

function UpgradePage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const region = useRegion();
  const isRow = region === "ROW";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{acc.isPro ? "You're on Pro 🎉" : "Upgrade to Pro"}</h1>
      <p className="mt-1 text-muted-foreground">{proPriceLine(region)}, cancel anytime. {isRow ? "Stripe checkout coming soon." : "Card, UPI, or netbanking at checkout."}</p>
      <p className="mt-1 text-sm font-medium text-muted-foreground">{testingBanner(region)}</p>
      {isRow && !acc.isPro && (
        <p className="mt-3 rounded-xl border p-3 text-base text-muted-foreground">Stripe checkout coming soon — Pro is $1/month. Razorpay checkout is for India only.</p>
      )}
      <div className="mt-6">
        <PricingCards
          region={region}
          freeCta={<Button variant="outline" disabled className="min-h-[52px] w-full rounded-xl text-base">{acc.isPro ? "Free plan" : "Current plan"}</Button>}
          proCta={acc.isPro
            ? <Button disabled className="min-h-[52px] w-full rounded-xl text-base">Current plan</Button>
            : isRow
              ? <Button disabled className="min-h-[52px] w-full rounded-xl text-lg">Stripe checkout coming soon</Button>
              : <Button onClick={() => void startProSubscription({ region, email: acc.user.email, onSuccess: () => void qc.invalidateQueries({ queryKey: ["account"] }) })} className="min-h-[52px] w-full rounded-xl text-lg">Upgrade ({proPriceLine(region)})</Button>}
        />
      </div>
    </div>
  );
}
