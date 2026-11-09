import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";

const statsQuery = (uid: string) =>
  queryOptions({
    queryKey: ["stats", uid],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [v, c, tv] = await Promise.all([
        supabase.from("page_views").select("created_at").eq("profile_id", uid).gte("created_at", since).limit(10000),
        supabase.from("link_clicks").select("created_at, link_id").eq("profile_id", uid).gte("created_at", since).limit(10000),
        supabase.from("page_views").select("id", { count: "exact", head: true }).eq("profile_id", uid),
      ]);
      return { views: v.data ?? [], clicks: c.data ?? [], totalViews: tv.count ?? 0 };
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await Promise.all([
      context.queryClient.ensureQueryData(statsQuery(acc.user.id)),
      context.queryClient.ensureQueryData(linksQuery(acc.user.id)),
    ]);
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: stats } = useSuspenseQuery(statsQuery(acc.user.id));
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const [range, setRange] = useState<7 | 30>(7);
  const days = acc.isPro ? range : 7;
  const cutoff = Date.now() - days * 864e5;
  const views = stats.views.filter((x) => +new Date(x.created_at) >= cutoff);
  const clicks = stats.clicks.filter((x) => +new Date(x.created_at) >= cutoff);

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 864e5);
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      views: views.filter((x) => x.created_at.slice(0, 10) === key).length,
      clicks: clicks.filter((x) => x.created_at.slice(0, 10) === key).length,
    };
  });
  const perLink = links.map((l) => ({ ...l, n: clicks.filter((c) => c.link_id === l.id).length })).sort((a, b) => b.n - a.n);
  const ctr = views.length ? Math.round((clicks.length / views.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total views" value={stats.totalViews} />
        <Stat label={`Clicks · ${days}d`} value={clicks.length} />
        <Stat label="Click rate" value={`${ctr}%`} />
      </div>
      <section className="rounded-3xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Views & clicks · last {days} days</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={days === 30 ? 6 : 0} />
              <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="views" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-3xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Clicks per link</h2>
        <ul className="mt-4 space-y-3">
          {perLink.map((l) => (
            <li key={l.id}>
              <div className="flex justify-between text-sm"><span className="truncate font-medium">{l.title}</span><span className="font-semibold">{l.n}</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${perLink[0]?.n ? (l.n / perLink[0].n) * 100 : 0}%` }} /></div>
            </li>
          ))}
          {perLink.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
        </ul>
      </section>
      {!acc.isPro && (
        <p className="rounded-2xl bg-primary-soft p-4 text-sm text-accent-foreground">
          Free shows the last 7 days. <Link to="/dashboard/upgrade" className="font-semibold underline">Go Pro</Link> for 30-day analytics.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
