import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminListReports, adminUpdateReport } from "@/lib/admin.functions";
import { AdminError, AdminLoading, fmtDateTime, ReasonDialog } from "@/components/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
});

const FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
] as const;

/**
 * Moderation inbox for storefront reports. Marking a report Reviewed
 * or Dismissed only records the decision (audit-logged) — it never
 * deletes or restricts anything by itself. Restricting a shop is the
 * separate suspend action on the business page, with its own reason.
 */
function AdminReportsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [pending, setPending] = useState<{ id: string; username: string; status: "reviewed" | "dismissed" } | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "reports", filter],
    queryFn: () => adminListReports({ data: filter === "all" ? {} : { status: filter } }),
  });

  const mutation = useMutation({
    mutationFn: (args: { id: string; status: "reviewed" | "dismissed"; reason: string }) =>
      adminUpdateReport({ data: { id: args.id, status: args.status, reason: args.reason || undefined } }),
    onSuccess: () => {
      toast.success("Decision recorded in the audit log.");
      setPending(null);
      void qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update this report."),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Reports</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Reports from visitors via "Report this shop" on storefronts. Reviewing a report never removes a shop —
        if a shop genuinely needs restricting, suspend it from its business page with a reason.
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "min-h-[40px] rounded-full border px-4 text-sm font-semibold transition",
              filter === f.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <AdminLoading />
      ) : error || !data ? (
        <AdminError message={error instanceof Error ? error.message : "Please try again."} />
      ) : data.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">No reports{filter !== "all" ? " with this status" : ""} yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-bold">izzytag.shop/{r.target_username}</span>
                <Badge>{r.reason}</Badge>
                <Badge variant={r.status === "open" ? "default" : "secondary"}>{r.status}</Badge>
                <span className="ml-auto text-sm text-muted-foreground">{fmtDateTime(r.created_at)}</span>
              </div>
              {r.details && <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{r.details}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                {r.reporter_email ? `Reporter: ${r.reporter_email}` : "Reporter didn't leave an email."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a
                  href={`/${r.target_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-md border px-4 text-sm font-semibold transition hover:bg-muted"
                >
                  View shop
                </a>
                {r.status === "open" && (
                  <>
                    <Button className="min-h-[44px]" onClick={() => setPending({ id: r.id, username: r.target_username, status: "reviewed" })}>
                      Mark reviewed
                    </Button>
                    <Button variant="outline" className="min-h-[44px]" onClick={() => setPending({ id: r.id, username: r.target_username, status: "dismissed" })}>
                      Dismiss
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending && (
        <ReasonDialog
          open={!!pending}
          onOpenChange={(o) => { if (!o) setPending(null); }}
          title={pending.status === "reviewed" ? "Mark this report reviewed?" : "Dismiss this report?"}
          description={
            pending.status === "reviewed"
              ? `You've looked into the report about izzytag.shop/${pending.username}. This records the decision only — it doesn't change the shop. Suspend the shop from Businesses if it needs restricting.`
              : `The report about izzytag.shop/${pending.username} doesn't need action. Dismissing only records that decision.`
          }
          confirmLabel={pending.status === "reviewed" ? "Mark reviewed" : "Dismiss report"}
          reasonRequired={false}
          busy={mutation.isPending}
          onConfirm={(reason) => mutation.mutate({ id: pending.id, status: pending.status, reason })}
        />
      )}
    </div>
  );
}
