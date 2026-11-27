import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Copy, Eye, MessageCircle, Package } from "lucide-react";
import { accountQuery, linksQuery } from "@/lib/account";
import { getHomeNextStep } from "@/lib/dashboard-home";
import { Button } from "@/components/ui/button";
import { BusinessDetails } from "@/components/BusinessDetails";
import { DashboardLoading } from "@/components/DashboardLoading";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const acc = await context.queryClient.ensureQueryData(accountQuery);
    await context.queryClient.ensureQueryData(linksQuery(acc.user.id));
  },
  pendingComponent: DashboardLoading,
  component: HomePage,
});

/**
 * Home (Dashboard A) — less things, one next step.
 * Shop name, photo and link at the top with See my shop. One
 * next-step card. Then Business details (moved here from My
 * Shop on 2026-11-27; the Your products grid was removed from
 * Home the same day — products live on the Products tab).
 * Referrals, views and the rest live under More.
 */
function HomePage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const { data: links } = useSuspenseQuery(linksQuery(acc.user.id));
  const p = acc.profile;
  const businessName = p.display_name || p.username || "Your shop";

  const [origin, setOrigin] = useState("https://izzytag.shop");
  useEffect(() => setOrigin(window.location.origin), []);
  const shopUrl = `${origin}/${p.username}`;

  const products = links.filter((l) => l.kind !== "link");
  const liveProducts = products.filter((l) => l.enabled);
  const nextStep = getHomeNextStep({ totalProducts: products.length, liveProducts: liveProducts.length });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      toast.success("Shop link copied");
    } catch {
      toast.error("Couldn't copy — long-press the link to copy it");
    }
  }

  async function shareOnWhatsApp() {
    const text = `${businessName} on izzy — browse the catalogue and order on WhatsApp. ${shopUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      {/* Shop header — name, photo, See my shop (each action once) */}
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {p.avatar_url
            ? <img src={p.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">{businessName[0]?.toUpperCase()}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold">{businessName}</h1>
              {p.suspended ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-sm font-semibold text-destructive">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Suspended
                </span>
              ) : liveProducts.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm font-semibold text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Not published yet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Live
                </span>
              )}
            </div>
            <p className="mt-1 text-base text-muted-foreground">
              {liveProducts.length > 0
                ? `${liveProducts.length} ${liveProducts.length === 1 ? "product is" : "products are"} live on your shop.`
                : "No products live yet."}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild className="min-h-[44px]"><a href={`/${p.username}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> See my shop</a></Button>
          <Button variant="outline" onClick={copyLink} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy link</Button>
        </div>
      </section>

      {/* One next step */}
      <section className="rounded-xl border-2 border-primary/30 bg-primary-soft p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Your next step</p>
        {nextStep.kind === "add-first-product" && (
          <>
            <h2 className="mt-1 text-xl font-bold text-accent-foreground">Add your first product</h2>
            <p className="mt-1 max-w-xl text-base leading-relaxed text-accent-foreground/80">Add a photo and a price. It will appear on your shop straight away.</p>
            <Button asChild className="mt-4 min-h-[48px] w-full text-base font-semibold sm:w-auto">
              <Link to="/dashboard/products"><Package className="h-4 w-4" /> Add your first product <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </>
        )}
        {nextStep.kind === "switch-on-first" && (
          <>
            <h2 className="mt-1 text-xl font-bold text-accent-foreground">Switch on your first product</h2>
            <p className="mt-1 max-w-xl text-base leading-relaxed text-accent-foreground/80">Your products are drafts. Switch one on to publish it to your shop.</p>
            <Button asChild className="mt-4 min-h-[48px] w-full text-base font-semibold sm:w-auto">
              <Link to="/dashboard/products"><Package className="h-4 w-4" /> Switch on your first product <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </>
        )}
        {nextStep.kind === "share-shop" && (
          <>
            <h2 className="mt-1 text-xl font-bold text-accent-foreground">Share your shop link</h2>
            <p className="mt-1 max-w-xl text-base leading-relaxed text-accent-foreground/80">Put your link where customers already are — Instagram bio or WhatsApp status.</p>
            <Button onClick={shareOnWhatsApp} className="mt-4 min-h-[48px] w-full bg-whatsapp text-base font-semibold text-whatsapp-foreground hover:bg-whatsapp/90 sm:w-auto">
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </>
        )}
      </section>

      {/* Business details (moved from My Shop, 2026-11-27) */}
      <BusinessDetails profile={p} userId={acc.user.id} />
    </div>
  );
}
