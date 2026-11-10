import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminGrowth } from "@/lib/admin.functions";
import { AdminCard, AdminError, AdminLoading } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/growth")({
  component: AdminGrowthPage,
});

function Metric({ label, value, definition }: { label: string; value: string; definition: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{definition}</p>
    </div>
  );
}

const num = (n: number) => n.toLocaleString("en-IN");
const pctVal = (n: number, p: number) => `${num(n)} · ${p}%`;

/**
 * Growth overview — platform funnel counts, every one computed
 * server-side from real rows (adminGrowth in admin.functions.ts)
 * and shown with the exact rule that produced it. WhatsApp clicks
 * are Order/Book taps; izzy cannot see messages sent or sales, and
 * nothing on this page pretends otherwise.
 */
function AdminGrowthPage() {
  const { data, isPending, error } = useQuery({ queryKey: ["admin", "growth"], queryFn: () => adminGrowth() });
  if (isPending) return <AdminLoading />;
  if (error || !data) return <AdminError message={error instanceof Error ? error.message : "Please try again."} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Growth</h1>
        <p className="mt-1 text-muted-foreground">
          The platform funnel, counted from real data. Each number states exactly how it is calculated.
        </p>
      </div>

      <AdminCard title="Businesses">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Total registered businesses"
            value={num(data.totalBusinesses)}
            definition="Every row in profiles — one per registered account, all time."
          />
          <Metric
            label="New in the last 7 days"
            value={num(data.newReg7)}
            definition="Profiles created in the last 7 days."
          />
          <Metric
            label="New in the last 30 days"
            value={num(data.newReg30)}
            definition="Profiles created in the last 30 days."
          />
        </div>
      </AdminCard>

      <AdminCard title="Activation">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Completed onboarding"
            value={pctVal(data.completedOnboarding, data.completedOnboardingPct)}
            definition="Businesses that claimed a shop username, out of all registered businesses. Claiming the username is the final onboarding step."
          />
          <Metric
            label="Added a first product"
            value={pctVal(data.withFirstProduct, data.withFirstProductPct)}
            definition="Businesses with at least one product or service row, drafts included, out of all registered businesses."
          />
          <Metric
            label="Published shops"
            value={pctVal(data.publishedShops, data.publishedPct)}
            definition="Businesses with a username claimed AND at least one live (enabled) product or service, out of all registered businesses."
          />
        </div>
      </AdminCard>

      <AdminCard title="Engagement">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Active shops · 30 days"
            value={num(data.activeShops30)}
            definition="Shops that received at least one visit in the last 30 days. A visit is one row in page_views — counted once per visitor session, owners excluded."
          />
          <Metric
            label="WhatsApp clicks · 30 days"
            value={num(data.whatsappClicks30)}
            definition="Order/Book button taps in the last 30 days. A tap opens WhatsApp — it is not a message sent and not an order."
          />
          <Metric
            label="WhatsApp clicks · all time"
            value={num(data.whatsappClicksAll)}
            definition="Every recorded Order/Book tap since tracking began, including all taps recorded before per-kind tracking started."
          />
        </div>
      </AdminCard>

      <AdminCard title="Plans">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric
            label="Active Pro subscriptions"
            value={num(data.activePro)}
            definition="Subscriptions with plan Pro, status active, and a current period that has not ended — the same rule the app itself uses."
          />
          <Metric
            label="Free-to-paid conversion"
            value={`${data.proConversionPct}%`}
            definition="Currently active Pro subscriptions divided by all registered businesses."
          />
        </div>
      </AdminCard>
    </div>
  );
}
