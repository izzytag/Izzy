import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, CreditCard, LifeBuoy, QrCode, Settings } from "lucide-react";
import { accountQuery } from "@/lib/account";
import { proPriceLine } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { ReferralCard } from "@/components/ReferralCard";
import { DashboardLoading } from "@/components/DashboardLoading";

export const Route = createFileRoute("/_authenticated/dashboard/more")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(accountQuery);
  },
  pendingComponent: DashboardLoading,
  component: MorePage,
});

/**
 * More — a plain list. Everything that is not Home, Products or
 * My Shop lives here. Existing pages keep their routes; this page
 * only links to them. Refer a seller sits at the bottom.
 */
function MorePage() {
  const region = useRegion();
  const { data: acc } = useSuspenseQuery(accountQuery);
  const p = acc.profile;

  const items = [
    { to: "/dashboard/analytics" as const, label: "Views & taps", hint: "How many people saw your shop and tapped products", icon: BarChart3 },
    { to: "/dashboard/qr" as const, label: "QR code", hint: "Print it for your counter or packaging", icon: QrCode },
    {
      to: "/dashboard/upgrade" as const,
      label: "Plan",
      hint: acc.isPro ? `Pro — ${proPriceLine(region)}` : `Free $0 · Pro ${proPriceLine(region)}`,
      icon: CreditCard,
    },
    { to: "/dashboard/settings" as const, label: "Settings", hint: "Account and shop settings", icon: Settings },
    { to: "/dashboard/support" as const, label: "Help", hint: "Contact support", icon: LifeBuoy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">More</h1>
        <p className="mt-1 text-base text-muted-foreground">Everything else for your shop, in one list.</p>
      </div>

      <section className="rounded-xl border bg-card">
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="flex min-h-[56px] items-center gap-3 px-5 py-3 transition hover:bg-muted/60">
                <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.label}</span>
                  <span className="block truncate text-sm text-muted-foreground">{item.hint}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ReferralCard username={p.username} />
    </div>
  );
}
