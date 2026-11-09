import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight, BarChart3, Check, Copy, Eye, Package, Palette, Share2, Store, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery, linksQuery } from "@/lib/account";
import { Button } from "@/components/ui/button";

/**
 * Same data the Analytics tab reads (page_views / link_clicks), so
 * Overview numbers always agree with Analytics. Plan gating matches
 * Analytics too: Free sees the last 7 days, Pro the last 30.
 */
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

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await Promise.all([
      context.queryClient.ensureQueryData(linksQuery(acc.user.id)),
      context.queryClient.ensureQueryData(statsQuery(acc.user.id)),
    ]);
  },
  component: OverviewPage,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function OverviewPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const { data: stats } = useSuspenseQuery(statsQuery(acc.user.id));
  const p = acc.profile;
  const businessName = p.display_name || p.username || "there";

  const [origin, setOrigin] = useState("https://izzytag.shop");
  useEffect(() => setOrigin(window.location.origin), []);
  const shopUrl = `${origin}/${p.username}`;
  const shopUrlDisplay = shopUrl.replace(/^https?:\/\//, "");

  const storeRows = links.filter((l) => l.kind !== "link");
  const liveCount = storeRows.filter((l) => l.enabled).length;

  const days = acc.isPro ? 30 : 7;
  const cutoff = Date.now() - days * 864e5;
  const viewsInWindow = stats.views.filter((x) => +new Date(x.created_at) >= cutoff).length;
  const tapsInWindow = stats.clicks.filter((x) => +new Date(x.created_at) >= cutoff).length;
  const hasActivity = stats.totalViews > 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      toast.success("Shop link copied");
    } catch {
      toast.error("Couldn't copy — long-press the link to copy it");
    }
  }

  async function shareLink() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: businessName, url: shopUrl });
        return;
      } catch {
        return; // user closed the share sheet — not an error
      }
    }
    await copyLink();
  }

  const checklist = [
    {
      done: !!(p.display_name?.trim() && p.bio?.trim()),
      label: "Complete your business profile",
      hint: "Name and a short description",
      to: "/dashboard/store" as const,
    },
    {
      done: !!p.whatsapp,
      label: "Add your WhatsApp number",
      hint: "So customers can order from you",
      to: "/dashboard/store" as const,
    },
    {
      done: !!p.username,
      label: "Choose your shop username",
      hint: "Your shareable shop link",
      to: "/dashboard/store" as const,
    },
    {
      done: storeRows.length > 0,
      label: "Add your first product",
      hint: "With a photo and a price",
      to: "/dashboard/products" as const,
    },
  ];
  const setupDone = checklist.every((c) => c.done);

  return (
    <div className="space-y-6">
      {/* ---------- Welcome ---------- */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{greeting()}, {businessName}</h1>
        <p className="mt-1 text-base text-muted-foreground">Here's what's happening with your business.</p>
      </div>

      {/* ---------- Shop status ---------- */}
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold">{p.display_name || p.username}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Live
              </span>
            </div>
            <p className="mt-1 break-all text-base font-medium text-primary">{shopUrlDisplay}</p>
            {liveCount === 0 && (
              <p className="mt-2 text-base text-muted-foreground">
                No products live yet — <Link to="/dashboard/products" className="font-semibold text-primary underline">add your first product</Link> and it will appear on your shop.
              </p>
            )}
            {liveCount > 0 && (
              <p className="mt-2 text-base text-muted-foreground">{liveCount} {liveCount === 1 ? "product or service is" : "products and services are"} live on your shop.</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild className="min-h-[44px]"><a href={`/${p.username}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> Preview</a></Button>
          <Button variant="outline" onClick={copyLink} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy link</Button>
          <Button onClick={shareLink} className="min-h-[44px]"><Share2 className="h-4 w-4" /> Share</Button>
        </div>
      </section>

      {/* ---------- Quick actions ---------- */}
      <section>
        <h2 className="text-lg font-bold">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link to="/dashboard/products" className="rounded-xl border bg-card p-4 transition hover:border-primary/40">
            <Package className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">Add a product</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Photo, price, done</p>
          </Link>
          <Link to="/dashboard/store" className="rounded-xl border bg-card p-4 transition hover:border-primary/40">
            <Store className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">Edit shop details</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Name, logo, WhatsApp</p>
          </Link>
          <Link to="/dashboard/appearance" className="rounded-xl border bg-card p-4 transition hover:border-primary/40">
            <Palette className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">Customize appearance</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Theme and socials</p>
          </Link>
          <button type="button" onClick={shareLink} className="rounded-xl border bg-card p-4 text-left transition hover:border-primary/40">
            <Share2 className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">Share shop link</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Put it in your bio</p>
          </button>
        </div>
      </section>

      {/* ---------- Setup checklist ---------- */}
      {setupDone ? (
        <section className="flex flex-wrap items-center gap-3 rounded-xl border bg-primary-soft p-4 sm:p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-accent-foreground">Setup complete</p>
            <p className="text-sm text-accent-foreground/80">Your shop is ready — keep sharing your link so customers find it.</p>
          </div>
          <Button size="sm" onClick={shareLink} className="min-h-[40px]"><Share2 className="h-4 w-4" /> Share</Button>
        </section>
      ) : (
        <section className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Finish setting up your shop</h2>
          <p className="mt-1 text-base text-muted-foreground">A few steps and you're ready to take orders.</p>
          <ul className="mt-4 divide-y">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link to={c.to} className="flex min-h-[56px] items-center gap-3 py-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-primary text-primary-foreground" : "border-2 border-border bg-card"}`}>
                    {c.done && <Check className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-medium ${c.done ? "text-muted-foreground line-through" : ""}`}>{c.label}</span>
                    <span className="block text-sm text-muted-foreground">{c.hint}</span>
                  </span>
                  {!c.done && <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                </Link>
              </li>
            ))}
            <li>
              <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="flex min-h-[56px] items-center gap-3 py-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card"><Eye className="h-4 w-4 text-muted-foreground" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Preview your shop</span>
                  <span className="block text-sm text-muted-foreground">See exactly what customers see</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </a>
            </li>
            <li>
              <button type="button" onClick={shareLink} className="flex min-h-[56px] w-full items-center gap-3 py-2 text-left">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card"><Share2 className="h-4 w-4 text-muted-foreground" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Share your shop link</span>
                  <span className="block text-sm text-muted-foreground">Instagram bio, WhatsApp status, anywhere</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          </ul>
        </section>
      )}

      {/* ---------- Performance ---------- */}
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><TrendingUp className="h-5 w-5 text-primary" /> Shop performance</h2>
          <Link to="/dashboard/analytics" className="flex items-center gap-1 text-sm font-semibold text-primary">Analytics <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {hasActivity ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Shop views · last {days} days</p>
                <p className="mt-1 font-display text-3xl font-bold">{viewsInWindow}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Product taps · last {days} days</p>
                <p className="mt-1 font-display text-3xl font-bold">{tapsInWindow}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><BarChart3 className="h-4 w-4" /> {stats.totalViews} total views since you opened your shop.</p>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-base leading-relaxed text-muted-foreground">
              Your shop's performance will appear here once customers start visiting — views and product taps, counted as they happen.
            </p>
            <Button variant="outline" onClick={shareLink} className="mt-4 min-h-[44px]"><Share2 className="h-4 w-4" /> Share your shop link</Button>
          </div>
        )}
      </section>

      {/* ---------- Recent activity ---------- */}
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Recent activity</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Nothing here yet. When customers view your shop and tap your products, you'll see the numbers in Analytics.
        </p>
        <Button variant="outline" asChild className="mt-4 min-h-[44px]">
          <Link to="/dashboard/products"><Package className="h-4 w-4" /> Add a product</Link>
        </Button>
      </section>
    </div>
  );
}
