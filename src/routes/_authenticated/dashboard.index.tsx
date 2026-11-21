import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight, Check, Copy, Eye, Package, Palette, QrCode, Share2, Store,
} from "lucide-react";
import { accountQuery, linksQuery } from "@/lib/account";
import { statsQuery } from "@/lib/stats";
import { ReferralCard } from "@/components/ReferralCard";
import { Button } from "@/components/ui/button";

/**
 * Same shared stats query the Analytics tab reads (lib/stats.ts), so
 * Overview numbers always agree with Analytics. Plan gating matches
 * Analytics too: Free sees the last 7 days, Pro the last 30.
 */

import { DashboardLoading } from "@/components/DashboardLoading";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await Promise.all([
      context.queryClient.ensureQueryData(linksQuery(acc.user.id)),
      context.queryClient.ensureQueryData(statsQuery(acc.user.id, acc.isPro)),
    ]);
  },
  pendingComponent: DashboardLoading,
  component: OverviewPage,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function OverviewPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const { data: stats } = useSuspenseQuery(statsQuery(acc.user.id, acc.isPro));
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
  // The share nudge always uses a plain 7-day window, whatever the plan.
  const viewsLast7 = stats.views.filter((x) => +new Date(x.created_at) >= Date.now() - 7 * 864e5).length;
  const tapsInWindow = [...stats.productViews, ...stats.whatsappClicks].filter((x) => +new Date(x.created_at) >= cutoff).length;
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
        // The pitch text travels with the link into WhatsApp and
        // Instagram DMs — a bare link with no context gets ignored.
        await navigator.share({ title: businessName, text: `${businessName} on izzy — browse the catalogue and order on WhatsApp.`, url: shopUrl });
        return;
      } catch {
        return; // user closed the share sheet — not an error
      }
    }
    await copyLink();
  }

  // Drafts are invisible to visitors, so "first product" only counts
  // once something is actually live. When drafts exist but nothing is
  // live, the step becomes switching one on — not adding another.
  const hasDraftsOnly = storeRows.length > 0 && liveCount === 0;

  const checklist = [
    {
      done: !!(p.display_name?.trim() && p.bio?.trim()),
      label: "Complete your business profile",
      hint: "Name and a short description",
      to: "/dashboard/store" as const,
      ctaTo: "/dashboard/store" as const,
    },
    {
      done: !!p.whatsapp,
      label: "Add your WhatsApp number",
      hint: "So customers can order from you",
      to: "/dashboard/store" as const,
      ctaTo: "/dashboard/store" as const,
    },
    {
      done: !!p.username,
      label: "Choose your shop username",
      hint: "Your shareable shop link",
      to: "/dashboard/store" as const,
      // Claiming a username happens in onboarding. The dashboard is
      // only reachable after a username exists, so in practice this
      // step is always complete here — the link is just a fallback.
      ctaTo: "/onboarding" as const,
    },
    {
      done: liveCount > 0,
      label: hasDraftsOnly ? "Switch your first product on" : "Add your first product",
      hint: hasDraftsOnly ? "Your items are drafts. Switch one on to publish it to your shop." : "With a photo and a price",
      to: "/dashboard/products" as const,
      ctaTo: "/dashboard/products" as const,
    },
  ];
  const setupDone = checklist.every((c) => c.done);
  const nextStep = checklist.find((c) => !c.done);
  const nextStepNumber = checklist.findIndex((c) => !c.done) + 1;
  // Factual, from the same stats the rest of this page shows: the
  // shop is set up with something live, but nobody has visited in a
  // week — the one useful thing left to do is share the link.
  const needsVisitors = setupDone && liveCount >= 1 && viewsLast7 === 0;

  return (
    <div className="space-y-10">
      {/* ---------- Welcome ---------- */}
      <div>
        <h1 className="text-xl font-semibold">{greeting()}, {businessName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your business.</p>
      </div>

      {/* ---------- Shop status ---------- */}
      <section className="border-b pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{p.display_name || p.username}</h2>
              {p.suspended ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Suspended
                </span>
              ) : liveCount === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Not published yet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-foreground" /> Live
                </span>
              )}
            </div>
            <p className="mt-1 break-all text-base font-medium text-foreground">{shopUrlDisplay}</p>
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
        <h2 className="text-base font-semibold">Quick actions</h2>
        <div className="mt-2 divide-y border-y">
          <Link to="/dashboard/products" className="flex items-center gap-3 py-3">
            <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Add a product</span>
              <span className="block text-sm text-muted-foreground">Photo, price, done</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
          <Link to="/dashboard/store" className="flex items-center gap-3 py-3">
            <Store className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Edit shop details</span>
              <span className="block text-sm text-muted-foreground">Name, logo, WhatsApp</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
          <Link to="/dashboard/appearance" className="flex items-center gap-3 py-3">
            <Palette className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Customize appearance</span>
              <span className="block text-sm text-muted-foreground">Theme and socials</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
          <button type="button" onClick={shareLink} className="flex w-full items-center gap-3 py-3 text-left">
            <Share2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Share shop link</span>
              <span className="block text-sm text-muted-foreground">Put it in your bio</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <Link to="/dashboard/qr" className="flex items-center gap-3 py-3">
            <QrCode className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Shop QR code</span>
              <span className="block text-sm text-muted-foreground">Print it for your counter</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </section>

      {/* ---------- Your next step ---------- */}
      {nextStep ? (
        <section className="border-t pt-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your next step · {nextStepNumber} of {checklist.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{nextStep.label}</h2>
          <p className="mt-1 max-w-xl text-base leading-relaxed text-muted-foreground">
            {nextStep.hint} — finish your setup one step at a time, and your shop is ready to share.
          </p>
          <Button asChild className="mt-4 min-h-[44px]">
            <Link to={nextStep.ctaTo}>{nextStep.label} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </section>
      ) : needsVisitors ? (
        <section className="border-t pt-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your next step</p>
          <h2 className="mt-1 text-lg font-semibold">Your shop is ready — now it needs visitors</h2>
          <p className="mt-1 max-w-xl text-base leading-relaxed text-muted-foreground">
            You have {liveCount} {liveCount === 1 ? "product or service" : "products and services"} live, but nobody has
            visited your shop in the last 7 days. Share your link where your customers already are — Instagram bio,
            WhatsApp status, or a printed QR code.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={shareLink} className="min-h-[44px]"><Share2 className="h-4 w-4" /> Share your shop link</Button>
            <Button variant="outline" onClick={copyLink} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy link</Button>
            <Button variant="outline" asChild className="min-h-[44px]">
              <Link to="/dashboard/qr"><QrCode className="h-4 w-4" /> Get your QR code</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="border-t pt-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your next step</p>
          <h2 className="mt-1 text-lg font-semibold">Share your shop link</h2>
          <p className="mt-1 max-w-xl text-base leading-relaxed text-muted-foreground">
            Your setup is complete. Put your link where customers already are — Instagram bio, WhatsApp status,
            or a printed QR code on your counter.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={shareLink} className="min-h-[44px]"><Share2 className="h-4 w-4" /> Share your shop link</Button>
            <Button variant="outline" onClick={copyLink} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy link</Button>
          </div>
        </section>
      )}

      {/* ---------- Setup checklist ---------- */}
      {setupDone ? (
        <section className="flex flex-wrap items-center gap-3 border-t pt-8">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background"><Check className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Setup complete</p>
            <p className="text-sm text-muted-foreground">Your shop is ready — keep sharing your link so customers find it.</p>
          </div>
          <Button size="sm" onClick={shareLink} className="min-h-[40px]"><Share2 className="h-4 w-4" /> Share</Button>
        </section>
      ) : (
        <section className="border-t pt-8">
          <h2 className="text-base font-semibold">Finish setting up your shop</h2>
          <p className="mt-1 text-sm text-muted-foreground">A few steps and you're ready to take orders.</p>
          <ul className="mt-4 divide-y border-y">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link to={c.to} className="flex min-h-[56px] items-center gap-3 py-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-foreground text-background" : "border border-input bg-background"}`}>
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
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-input bg-background"><Eye className="h-4 w-4 text-muted-foreground" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Preview your shop</span>
                  <span className="block text-sm text-muted-foreground">See exactly what customers see</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </a>
            </li>
            {/* Sharing an empty shop sends visitors to nothing — the
                share row only appears once something is live. */}
            {liveCount > 0 && (
              <li>
                <button type="button" onClick={shareLink} className="flex min-h-[56px] w-full items-center gap-3 py-2 text-left">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-input bg-background"><Share2 className="h-4 w-4 text-muted-foreground" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">Share your shop link</span>
                    <span className="block text-sm text-muted-foreground">Instagram bio, WhatsApp status, anywhere</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )}
          </ul>
        </section>
      )}

      {/* ---------- Performance ---------- */}
      <section className="border-t pt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Shop performance</h2>
          <Link to="/dashboard/analytics" className="flex items-center gap-1 text-sm font-medium text-muted-foreground">Analytics <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {hasActivity ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Shop views · last {days} days</p>
                <p className="mt-1 text-2xl font-semibold">{viewsInWindow}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product taps · last {days} days</p>
                <p className="mt-1 text-2xl font-semibold">{tapsInWindow}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{stats.totalViews} total views since you opened your shop.</p>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-base leading-relaxed text-muted-foreground">
              Your shop's performance will appear here once customers start visiting — views and product taps, counted as they happen.
            </p>
            {liveCount > 0 ? (
              <Button variant="outline" onClick={shareLink} className="mt-4 min-h-[44px]"><Share2 className="h-4 w-4" /> Share your shop link</Button>
            ) : (
              <Button variant="outline" asChild className="mt-4 min-h-[44px]">
                <Link to="/dashboard/products"><Package className="h-4 w-4" /> {hasDraftsOnly ? "Switch on your first product" : "Add your first product"}</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ---------- Recent activity ---------- */}
      <section className="border-t pt-8">
        <h2 className="text-base font-semibold">Recent activity</h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Nothing here yet. When customers view your shop and tap your products, you'll see the numbers in Analytics.
        </p>
        <Button variant="outline" asChild className="mt-4 min-h-[44px]">
          <Link to="/dashboard/products"><Package className="h-4 w-4" /> Add a product</Link>
        </Button>
      </section>

      {/* ---------- More ---------- */}
      <section className="border-t pt-8">
        <h2 className="text-base font-semibold">More</h2>
        <div className="mt-2">
          <ReferralCard username={p.username} />
        </div>
      </section>
    </div>
  );
}
