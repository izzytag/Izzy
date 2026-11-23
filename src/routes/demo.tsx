import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PublicProfile, type PublicData } from "@/components/PublicProfile";
import { Button } from "@/components/ui/button";
import { DEMO_PRIYA } from "@/lib/demo-shops";

// Layout route for the demo shops: /demo itself is served by the
// demo.index child, and /demo/thread-studio and /demo/glow-lab by
// their own child routes. This route renders only an <Outlet/> —
// rendering a shop here would swallow the children, since a parent
// route's component renders for every child match.
export const Route = createFileRoute("/demo")({
  component: DemoLayout,
});

function DemoLayout() {
  return <Outlet />;
}

/* ---------- Demo shop: fixed example content rendered by the real
   storefront component (see src/lib/demo-shops.ts). No database reads
   or writes, no tracking, no WhatsApp number — the order actions
   route to signup instead. ---------- */

// The /demo shop, kept exported for the products-only test.
export const DEMO_SHOP: PublicData = DEMO_PRIYA;

export function DemoBanner() {
  return (
    // On phones the banner scrolls away with the page (a sticky banner
    // would eat the top of a small screen); on wider screens it stays
    // pinned. The call to action is full-width below the text on
    // phones, and sits in the row on wider screens.
    <div className="border-b border-border bg-card/95 backdrop-blur sm:sticky sm:top-0 sm:z-40">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
        <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
          Demo shop
        </span>
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
          This is an example shop built with izzy. Nothing here is for sale — try it, then create
          your own.
        </p>
        <Button asChild size="sm" className="min-h-[44px] w-full px-5 text-sm sm:w-auto">
          <Link to="/auth">Create your own shop</Link>
        </Button>
      </div>
    </div>
  );
}

export function DemoShopPage({ shop = DEMO_PRIYA }: { shop?: PublicData } = {}) {
  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <PublicProfile data={shop} theme="light" showBranding demoMode />
    </div>
  );
}
