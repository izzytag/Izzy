import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { accountQuery } from "@/lib/account";
import { PRO_PRICE_DISPLAY_LINE, TESTING_BANNER, startProSubscription } from "@/lib/billing";
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
      <p className="mt-1 text-muted-foreground">{PRO_PRICE_DISPLAY_LINE}, cancel anytime. Card, UPI, or netbanking at checkout.</p>
      <p className="mt-1 text-sm font-medium text-muted-foreground">{TESTING_BANNER}</p>
      <div className="mt-6">
        <PricingCards
          freeCta={<Button variant="outline" disabled className="min-h-[52px] w-full rounded-xl text-base">{acc.isPro ? "Free plan" : "Current plan"}</Button>}
          proCta={acc.isPro
            ? <Button disabled className="min-h-[52px] w-full rounded-xl text-base">Current plan</Button>
            : <Button onClick={startProSubscription} className="min-h-[52px] w-full rounded-xl text-lg">Upgrade ({PRO_PRICE_DISPLAY_LINE})</Button>}
        />
      </div>
    </div>
  );
}
