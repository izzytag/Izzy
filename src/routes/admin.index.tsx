import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminOverview } from "@/lib/admin.functions";
import { AdminCard, AdminError, AdminLoading, fmtDate } from "@/components/admin-ui";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: AdminOverviewPage,
});

function Metric({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value.toLocaleString("en-IN")}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Platform overview — every number here is a real count from the
 * database (profiles, links, subscriptions, page_views, link_clicks),
 * computed inside the admin server function. Nothing is estimated.
 */
function AdminOverviewPage() {
  const { data, isPending, error } = useQuery({ queryKey: ["admin", "overview"], queryFn: () => adminOverview() });
  if (isPending) return <AdminLoading />;
  if (error || !data) return <AdminError message={error instanceof Error ? error.message : "Please try again."} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Platform overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Registered businesses" value={data.totalBusinesses} />
        <Metric label="Published shops" value={data.publishedShops} hint="Businesses with a shop link claimed" />
        <Metric label="Products & services" value={data.totalProducts} hint="Across all shops, drafts included" />
        <Metric label="Active Pro subscriptions" value={data.activePro} />
        <Metric label="Free accounts" value={data.freeAccounts} hint="Businesses not on active Pro" />
        <Metric label="Suspended shops" value={data.suspendedShops} />
        <Metric label="Total shop visits" value={data.totalViews} hint="All time, one per visitor session" />
        <Metric label="Total WhatsApp clicks" value={data.totalWhatsappClicks} hint="Order/Book taps — not confirmed orders" />
      </div>

      <AdminCard title="Recent registrations">
        {data.recentRegistrations.length === 0 ? (
          <p className="text-muted-foreground">No businesses have registered yet.</p>
        ) : (
          <ul className="divide-y">
            {data.recentRegistrations.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="font-semibold">{p.display_name || (p.username ? `@${p.username}` : "Unnamed business")}</span>
                {p.username && <span className="text-sm text-muted-foreground">izzytag.shop/{p.username}</span>}
                {p.suspended && <Badge variant="destructive">Suspended</Badge>}
                <span className="ml-auto text-sm text-muted-foreground">{fmtDate(p.created_at)}</span>
                <Link to="/admin/business/$userId" params={{ userId: p.id }} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
