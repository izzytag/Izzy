import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  adminGetBusiness,
  adminGrantPro,
  adminRevokePro,
  adminSetSuspended,
} from "@/lib/admin.functions";
import { GRANT_MONTHS } from "@/lib/admin";
import { AdminCard, AdminError, AdminLoading, fmtDate, fmtDateTime, PlanBadge, ReasonDialog } from "@/components/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/business/$userId")({
  component: AdminBusinessDetailPage,
});

type Action =
  | { kind: "suspend" }
  | { kind: "reactivate" }
  | { kind: "grant"; months: number }
  | { kind: "revoke" }
  | null;

const ACTION_COPY: Record<Exclude<Action, null>["kind"], { title: string; confirm: string; destructive?: boolean }> = {
  suspend: {
    title: "Suspend this shop?",
    confirm: "Suspend shop",
    destructive: true,
  },
  reactivate: { title: "Reactivate this shop?", confirm: "Reactivate shop" },
  grant: { title: "Grant Pro manually?", confirm: "Grant Pro" },
  revoke: { title: "End this Pro subscription?", confirm: "End Pro", destructive: true },
};

function describe(action: Exclude<Action, null>, shopName: string): string {
  switch (action.kind) {
    case "suspend":
      return `${shopName} will immediately show as "temporarily unavailable" to customers — no products, no WhatsApp orders. The owner keeps dashboard access and loses no data. Nothing is deleted.`;
    case "reactivate":
      return `${shopName} will become visible to customers again, exactly as it was.`;
    case "grant":
      return `${shopName} gets Pro for ${action.months} month${action.months === 1 ? "" : "s"} from today, free of charge — the manual-grant path used for offers like the creator programme's 6 free months. No payment is taken and no Razorpay subscription is created.`;
    case "revoke":
      return `${shopName} moves back to Free entitlements right away (5-item limit for new products, basic themes, 7-day analytics). Existing products and data are NOT deleted. If this business pays via Razorpay, cancelling there is separate — this only ends the local record, the same end state the Razorpay webhook writes.`;
  }
}

function AdminBusinessDetailPage() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "business", userId],
    queryFn: () => adminGetBusiness({ data: { userId } }),
  });

  const mutation = useMutation({
    mutationFn: async ({ act, reason }: { act: Exclude<Action, null>; reason: string }) => {
      switch (act.kind) {
        case "suspend":
          return adminSetSuspended({ data: { userId, suspended: true, reason } });
        case "reactivate":
          return adminSetSuspended({ data: { userId, suspended: false, reason } });
        case "grant":
          return adminGrantPro({ data: { userId, months: act.months, reason } });
        case "revoke":
          return adminRevokePro({ data: { userId, reason } });
      }
    },
    onSuccess: () => {
      toast.success("Done — the action and your reason are in the audit log.");
      setAction(null);
      void qc.invalidateQueries({ queryKey: ["admin", "business", userId] });
      void qc.invalidateQueries({ queryKey: ["admin", "businesses"] });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again."),
  });

  if (isPending) return <AdminLoading />;
  if (error || !data) return <AdminError message={error instanceof Error ? error.message : "Business not found."} />;

  const p = data.profile;
  const shopName = p.display_name || (p.username ? `@${p.username}` : "This business");
  const sub = data.subscription;

  return (
    <div className="space-y-6">
      <Link to="/admin/businesses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All businesses
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{shopName}</h1>
        <PlanBadge plan={data.isPro ? "pro" : "free"} suspended={p.suspended} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Business information">
          <dl className="space-y-2.5 text-base">
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Business name</dt><dd className="font-medium">{p.display_name || "—"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Category</dt><dd className="font-medium">{p.category || "—"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Bio</dt><dd className="font-medium">{p.bio || "—"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Owner email</dt><dd className="font-medium">{data.ownerEmail || "Not available"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">WhatsApp</dt><dd className="font-medium">{p.whatsapp || "Not set"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Registered</dt><dd className="font-medium">{fmtDate(p.created_at)}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Account status</dt><dd className="font-medium">{p.suspended ? "Suspended" : "Active"}</dd></div>
          </dl>
        </AdminCard>

        <AdminCard title="Shop & engagement">
          <dl className="space-y-2.5 text-base">
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-muted-foreground">Shop URL</dt>
              <dd className="font-medium">
                {p.username ? (
                  <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">
                    izzytag.shop/{p.username} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : "No shop link claimed yet"}
              </dd>
            </div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Published</dt><dd className="font-medium">{p.username ? "Yes — live at the shop URL" : "No"}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Products & services</dt><dd className="font-medium">{data.productCount}</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Shop visits</dt><dd className="font-medium">{data.shopViews.toLocaleString("en-IN")} (all time)</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">WhatsApp clicks</dt><dd className="font-medium">{data.whatsappClicks.toLocaleString("en-IN")} (all time)</dd></div>
            <div className="flex gap-2"><dt className="w-36 shrink-0 text-muted-foreground">Theme</dt><dd className="font-medium">{p.theme}</dd></div>
          </dl>
        </AdminCard>
      </div>

      <AdminCard title="Subscription">
        {sub ? (
          <dl className="space-y-2.5 text-base">
            <div className="flex gap-2"><dt className="w-44 shrink-0 text-muted-foreground">Plan</dt><dd className="font-medium">{sub.plan === "pro" ? "Pro" : "Free"}</dd></div>
            <div className="flex gap-2"><dt className="w-44 shrink-0 text-muted-foreground">Status (as stored)</dt><dd className="font-medium">{sub.status}</dd></div>
            <div className="flex gap-2"><dt className="w-44 shrink-0 text-muted-foreground">Pro active right now</dt><dd className="font-medium">{data.isPro ? "Yes" : "No"}</dd></div>
            <div className="flex gap-2"><dt className="w-44 shrink-0 text-muted-foreground">Current period ends</dt><dd className="font-medium">{fmtDate(sub.current_period_end)}</dd></div>
            <div className="flex gap-2"><dt className="w-44 shrink-0 text-muted-foreground">Payment reference</dt><dd className="font-medium">{sub.razorpay_subscription_id ?? "Manual grant (no Razorpay subscription)"}</dd></div>
            <div className="flex gap-2"><dt className="w-44 shrink-0 text-muted-foreground">Last updated</dt><dd className="font-medium">{fmtDateTime(sub.updated_at)}</dd></div>
          </dl>
        ) : (
          <p className="text-muted-foreground">No subscription record — this business is on Free and has never upgraded or been granted Pro.</p>
        )}
      </AdminCard>

      <AdminCard title="Admin actions">
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Every action asks for a reason and is written to the audit log with your email and the time. Nothing here deletes business data or changes who owns the account.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {p.suspended ? (
            <Button variant="outline" className="min-h-[44px]" onClick={() => setAction({ kind: "reactivate" })}>Reactivate shop</Button>
          ) : (
            <Button variant="destructive" className="min-h-[44px]" onClick={() => setAction({ kind: "suspend" })}>Suspend shop</Button>
          )}
          {!data.isPro &&
            GRANT_MONTHS.map((m) => (
              <Button key={m} variant="outline" className="min-h-[44px]" onClick={() => setAction({ kind: "grant", months: m })}>
                Grant Pro — {m} month{m === 1 ? "" : "s"}
              </Button>
            ))}
          {(sub || data.isPro) && (
            <Button variant="outline" className="min-h-[44px] text-destructive hover:text-destructive" onClick={() => setAction({ kind: "revoke" })}>
              End Pro (back to Free)
            </Button>
          )}
        </div>
      </AdminCard>

      <AdminCard title="Recent admin actions on this business">
        {data.auditTrail.length === 0 ? (
          <p className="text-muted-foreground">No admin actions recorded for this business yet.</p>
        ) : (
          <ul className="divide-y">
            {data.auditTrail.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 py-2.5 text-base">
                <Badge variant="secondary">{a.action}</Badge>
                <span className="text-muted-foreground">{a.admin_email}</span>
                {a.reason && <span>“{a.reason}”</span>}
                <span className="ml-auto text-sm text-muted-foreground">{fmtDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {action && (
        <ReasonDialog
          open={!!action}
          onOpenChange={(o) => { if (!o) setAction(null); }}
          title={ACTION_COPY[action.kind].title}
          description={describe(action, shopName)}
          confirmLabel={ACTION_COPY[action.kind].confirm}
          destructive={ACTION_COPY[action.kind].destructive}
          busy={mutation.isPending}
          onConfirm={(reason) => mutation.mutate({ act: action, reason })}
        />
      )}
    </div>
  );
}
