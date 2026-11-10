import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { accountQuery, linksQuery } from "@/lib/account";
import { statsQuery } from "@/lib/stats";
import { sourceLabel } from "@/lib/source";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await Promise.all([
      context.queryClient.ensureQueryData(statsQuery(acc.user.id, acc.isPro)),
      context.queryClient.ensureQueryData(linksQuery(acc.user.id)),
    ]);
  },
  component: AnalyticsPage,
});

/** Display order for the traffic-source breakdown. */
const SOURCE_ORDER = ["Instagram", "WhatsApp", "Facebook", "Google", "QR code", "Direct", "Other referral", "Other"];

function AnalyticsPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: stats } = useSuspenseQuery(statsQuery(acc.user.id, acc.isPro));
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const [range, setRange] = useState<7 | 30>(7);
  // Plan gating, unchanged: Free always sees the last 7 days, Pro can
  // switch to 30. No longer windows are offered.
  const days = acc.isPro ? range : 7;
  const cutoff = Date.now() - days * 864e5;
  const inWindow = (x: { created_at: string }) => +new Date(x.created_at) >= cutoff;

  const views = stats.views.filter(inWindow);
  const productViews = stats.productViews.filter(inWindow);
  const whatsappClicks = stats.whatsappClicks.filter(inWindow);

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 864e5);
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      views: views.filter((x) => x.created_at.slice(0, 10) === key).length,
    };
  });
  const maxDaily = Math.max(1, ...daily.map((d) => d.views));

  // Traffic sources: only visits whose stored source label we know.
  // Visits recorded before source tracking have no label and are not
  // guessed at — they simply don't appear here.
  const sourceCounts = new Map<string, number>();
  for (const v of views) {
    if (!v.source) continue;
    const label = sourceLabel(v.source);
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
  }
  const sources = SOURCE_ORDER.filter((l) => sourceCounts.has(l)).map((l) => ({ label: l, n: sourceCounts.get(l)! }));
  const maxSource = Math.max(1, ...sources.map((s) => s.n));

  const items = links.filter((l) => l.kind === "product" || l.kind === "service");
  const countBy = (rows: { link_id: string }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.link_id, (m.get(r.link_id) ?? 0) + 1);
    return m;
  };
  const viewsByItem = countBy(productViews);
  const clicksByItem = countBy(whatsappClicks);
  const ranked = (m: Map<string, number>) =>
    items
      .map((l) => ({ id: l.id, title: l.title, n: m.get(l.id) ?? 0 }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  const mostViewed = ranked(viewsByItem);
  const mostClicked = ranked(clicksByItem);
  const liveItems = items.filter((l) => l.enabled);
  const quietItems = liveItems.filter((l) => !viewsByItem.has(l.id) && !clicksByItem.has(l.id));

  const nothingYet = stats.totalViews === 0 && productViews.length === 0 && whatsappClicks.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex rounded-full bg-muted p-1 text-sm">
          {[7, 30].map((r) => (
            <button key={r} onClick={() => setRange(r as 7 | 30)} disabled={r === 30 && !acc.isPro}
              className={`rounded-full px-3 py-1.5 font-medium ${days === r ? "bg-card shadow-sm" : "text-muted-foreground"} disabled:opacity-50`}>
              {r} days{r === 30 && !acc.isPro ? " 🔒" : ""}
            </button>
          ))}
        </div>
      </div>

      {nothingYet ? (
        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">No visits yet</h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
            Your analytics will appear here once customers start visiting your shop — shop views, product views
            and WhatsApp taps, counted as they happen.
          </p>
          <Button asChild className="mt-4 min-h-[44px]">
            <Link to="/dashboard/qr"><Share2 className="h-4 w-4" /> Share your shop</Link>
          </Button>
        </section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label={`Shop views · ${days}d`}
              value={views.length}
              hint="Times your shop page was opened. Repeat refreshes in the same visit count once."
              sub={`${stats.totalViews} since you opened your shop`}
            />
            <Stat
              label={`Product views · ${days}d`}
              value={productViews.length}
              hint="Times a customer opened a product's details to look closer."
            />
            <Stat
              label={`WhatsApp clicks · ${days}d`}
              value={whatsappClicks.length}
              hint="People who tapped a WhatsApp order button. This doesn't confirm an order."
            />
          </div>

          <section className="rounded-3xl border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Shop views per day · last {days} days</h2>
            {views.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No shop views in this period yet.</p>
            ) : (
              <div className="mt-6">
                <div className="flex h-40 items-end gap-1" role="img" aria-label={`Shop views per day over the last ${days} days`}>
                  {daily.map((d, i) => (
                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end self-stretch">
                      <span className="mb-1 text-[11px] font-medium text-muted-foreground">{d.views > 0 ? d.views : ""}</span>
                      <div
                        className="w-full max-w-8 rounded-t bg-primary"
                        style={{ height: `${d.views === 0 ? 0 : Math.max(4, (d.views / maxDaily) * 100)}%` }}
                        title={`${d.day}: ${d.views} shop views`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1 border-t pt-2">
                  {daily.map((d, i) => (
                    <p key={i} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground">
                      {days === 7 || i % 5 === 0 || i === days - 1 ? d.day : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Where your visitors came from · {days}d</h2>
            {sources.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Sources will appear here once visits come in. When a customer arrives from a labelled link
                (like your QR code or Instagram bio) or another app, we show it here — we never guess.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {sources.map((s) => (
                  <li key={s.label}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{s.label}</span>
                      <span className="font-semibold">{s.n}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(s.n / maxSource) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-bold">Most viewed products</h2>
              <RankedList rows={mostViewed} empty="No product views in this period yet. When a customer opens a product's details, it counts here." />
            </section>
            <section className="rounded-3xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-bold">Most WhatsApp clicks</h2>
              <RankedList rows={mostClicked} empty="No WhatsApp clicks in this period yet. A click means a customer tapped Order or Book on WhatsApp — not a confirmed order." />
            </section>
          </div>

          <section className="rounded-3xl border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Products with no engagement yet</h2>
            {liveItems.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                You have no live products right now. <Link to="/dashboard/products" className="font-semibold text-primary underline">Add or publish a product</Link> and it will show up here.
              </p>
            ) : quietItems.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Every live product got at least a look in the last {days} days — nice work.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  These live products had no views or WhatsApp taps in the last {days} days. A clearer photo,
                  a price on the card, and sharing your shop link usually help customers find them.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {quietItems.map((l) => (
                    <li key={l.id} className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">{l.title}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      {!acc.isPro && (
        <p className="rounded-2xl bg-primary-soft p-4 text-sm text-accent-foreground">
          Free shows the last 7 days. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro</Link> for 30-day analytics.
        </p>
      )}
    </div>
  );
}

function RankedList({ rows, empty }: { rows: { id: string; title: string; n: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((r) => (
        <li key={r.id}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate font-medium">{r.title}</span>
            <span className="font-semibold">{r.n}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, hint, sub }: { label: string; value: number | string; hint: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
      {sub && <p className="mt-1 text-sm font-medium">{sub}</p>}
    </div>
  );
}
