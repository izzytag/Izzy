import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListReferrals, type ReferralReviewRow } from "@/lib/admin.functions";
import { REFERRAL_REWARD_CAP_PER_YEAR, REFERRAL_REWARD_MONTHS } from "@/lib/referral";
import { AdminCard, AdminError, AdminLoading, fmtDate } from "@/components/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/referrals")({
  component: AdminReferralsPage,
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

function ReferrerSection({ group }: { group: ReferralReviewRow }) {
  const name = group.referrerDisplayName || (group.referrerUsername ? `@${group.referrerUsername}` : "Unnamed business");
  return (
    <AdminCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          {group.referrerUsername && (
            <p className="text-sm text-muted-foreground">izzytag.shop/{group.referrerUsername}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {num(group.signups)} signed up · {num(group.active)} active · {num(group.grantedMonthsThisYear)} months
            granted this year · {num(group.pending)} pending
          </p>
        </div>
        {group.pending > 0 ? (
          <Button asChild className="min-h-[44px]">
            <Link to="/admin/business/$userId" params={{ userId: group.referrerId }} search={{ grant: "referral" }}>
              Review and grant
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link to="/admin/business/$userId" params={{ userId: group.referrerId }}>
              View business
            </Link>
          </Button>
        )}
      </div>

      <ul className="mt-4 divide-y border-t">
        {group.referrals.map((r) => (
          <li key={r.userId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 text-base">
            <span className="font-medium">{r.displayName || (r.username ? `@${r.username}` : "Unnamed business")}</span>
            {r.username && <span className="text-sm text-muted-foreground">izzytag.shop/{r.username}</span>}
            <Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Active" : "Pending"}</Badge>
            <span className="ml-auto text-sm text-muted-foreground">
              Signed up {fmtDate(r.signedUpAt)}
              {r.firstLiveProductAt ? ` · First live product ${fmtDate(r.firstLiveProductAt)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}

/**
 * Referral review — the manual fulfilment queue. Every attributed
 * signup is grouped by referrer with the facts needed to decide a
 * grant: how many signed up, how many became genuinely active, how
 * many free months were already granted this year, and how many
 * rewards are still pending under the yearly cap. Grants themselves
 * happen on the business page through the existing manual grant
 * flow, with the reason prefilled as "Referral reward".
 */
function AdminReferralsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "referrals"],
    queryFn: () => adminListReferrals(),
  });
  if (isPending) return <AdminLoading />;
  if (error || !data) return <AdminError message={error instanceof Error ? error.message : "Please try again."} />;

  if (!data.available) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold">Referrals</h1>
          <p className="mt-1 text-muted-foreground">
            Referral tracking is not active. The database update for referral attribution has not been applied.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Referrals</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Referral rewards are reviewed here and granted manually. A referral earns{" "}
          {REFERRAL_REWARD_MONTHS} month of Pro when the referred shop becomes active. The annual limit is{" "}
          {REFERRAL_REWARD_CAP_PER_YEAR} months per referrer. Active means the shop link is claimed, a WhatsApp
          number is set, and at least one product is live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Attributed signups"
          value={num(data.totals.signups)}
          definition="Accounts with a referrer recorded, all time."
        />
        <Metric
          label="Active referrals"
          value={num(data.totals.active)}
          definition="Attributed accounts that meet the active definition right now."
        />
        <Metric
          label="Months granted this year"
          value={num(data.totals.grantedMonthsThisYear)}
          definition="Free Pro months granted with the referral reason in the current calendar year, counted from the audit log."
        />
        <Metric
          label="Rewards pending"
          value={num(data.totals.pending)}
          definition="Active referrals up to the yearly cap, minus months already granted this year."
        />
      </div>

      {data.referrers.length === 0 ? (
        <AdminCard>
          <p className="text-muted-foreground">No referrals recorded yet.</p>
        </AdminCard>
      ) : (
        data.referrers.map((group) => <ReferrerSection key={group.referrerId} group={group} />)
      )}
    </div>
  );
}
