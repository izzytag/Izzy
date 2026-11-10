import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListSubscriptions } from "@/lib/admin.functions";
import { AdminError, AdminLoading, fmtDate, fmtDateTime, PlanBadge } from "@/components/admin-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptionsPage,
});

/**
 * Read-only view of the subscriptions table — one current record per
 * business. There is no payments/invoices table in izzy, and no card
 * data exists anywhere in the system (Razorpay holds it), so none is
 * shown. Manual adjustments happen on the business page, with a
 * reason, and are audit-logged.
 */
function AdminSubscriptionsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => adminListSubscriptions(),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Subscriptions</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        One record per business, exactly as stored. To grant or end Pro for a business, open it under{" "}
        <Link to="/admin/businesses" className="font-semibold text-primary underline-offset-2 hover:underline">Businesses</Link>{" "}
        — changes there need a reason and are audit-logged.
      </p>
      {isPending ? (
        <AdminLoading />
      ) : error || !data ? (
        <AdminError message={error instanceof Error ? error.message : "Please try again."} />
      ) : data.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">No subscription records yet — every business is on Free.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status (stored)</TableHead>
                <TableHead>Period ends</TableHead>
                <TableHead>Payment reference</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.user_id}>
                  <TableCell>
                    <Link to="/admin/business/$userId" params={{ userId: s.user_id }} className="font-semibold text-primary underline-offset-2 hover:underline">
                      {s.displayName || (s.username ? `@${s.username}` : "Unnamed business")}
                    </Link>
                    {s.username && <span className="block text-sm text-muted-foreground">izzytag.shop/{s.username}</span>}
                  </TableCell>
                  <TableCell><PlanBadge plan={s.isProNow ? "pro" : "free"} /></TableCell>
                  <TableCell className="text-muted-foreground">{s.status}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(s.current_period_end)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.razorpay_subscription_id ?? "Manual grant"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDateTime(s.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
