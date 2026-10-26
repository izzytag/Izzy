import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { accountQuery } from "@/lib/account";
import { startProSubscription } from "@/lib/billing";
import { PricingCards } from "@/components/PricingCards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/upgrade")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: UpgradePage,
});

function UpgradePage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{acc.isPro ? "You're on Pro 🎉" : "Upgrade to Pro"}</h1>
      <p className="mt-1 text-muted-foreground">$1/month, cancel anytime. Card, UPI, or netbanking at checkout.</p>
      <div className="mt-6">
        <PricingCards
          freeCta={<Button variant="outline" disabled className="w-full rounded-xl">{acc.isPro ? "Free plan" : "Current plan"}</Button>}
          proCta={acc.isPro
            ? <Button disabled className="w-full rounded-xl">Current plan</Button>
            : <Button onClick={startProSubscription} className="h-12 w-full rounded-xl text-base">Upgrade for $1/month</Button>}
        />
      </div>
    </div>
  );
}
