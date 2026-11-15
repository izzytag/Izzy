import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicProfile, type PublicData } from "@/components/PublicProfile";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo shop — izzy" },
      { name: "description", content: "Try an example izzy shop: browse the catalogue, open a product, and see how ordering on WhatsApp works." },
      // An example shop is not a real business — keep it out of search results.
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoShopPage,
});

/* ---------- Demo shop: fixed example content rendered by the real
   storefront component, using the site's own example photos (the
   same shop shown in the homepage hero, now interactive). No
   database reads or writes, no tracking, no WhatsApp number — the
   order actions route to signup instead. ---------- */

export const DEMO_SHOP: PublicData = {
  display_name: "Priya's Kitchen",
  username: "demo",
  bio: "Homemade cakes and tiffins in Pune. Order by 10am for lunch.",
  avatar_url: "/examples/priya-logo.webp",
  socials: {},
  whatsapp: null,
  upi_id: null,
  links: [
    { id: "demo-0", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate, baked fresh to order.", image_urls: ["/examples/chocolate-cake.webp"], category: null },
    { id: "demo-1", title: "Sourdough loaf", url: "#", kind: "product", price: "₹199", description: "Slow-fermented, crusty and fresh every morning.", image_urls: ["/examples/sourdough-loaf.webp"], category: null },
    { id: "demo-2", title: "Chocolate cake (1 kg)", url: "#", kind: "product", price: "₹899", description: "The same Belgian chocolate cake, baked as a 1 kg celebration cake.", image_urls: ["/examples/priya-cake-1kg.webp"], category: null },
    { id: "demo-3", title: "Sourdough loaf (pack of 2)", url: "#", kind: "product", price: "₹349", description: "Two slow-fermented loaves, baked fresh every morning.", image_urls: ["/examples/priya-sourdough-two.webp"], category: null },
    { id: "demo-4", title: "Celebration cake consultation", url: "#", kind: "service", price: "₹999", description: "A one-to-one session to plan your celebration cake, from flavours to design.", image_urls: ["/examples/priya-consultation.webp"], category: null },
  ],
};

function DemoBanner() {
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
          This is an example shop built with izzy. Nothing here is for sale — try it, then create your own.
        </p>
        <Button asChild size="sm" className="min-h-[44px] w-full px-5 text-sm sm:w-auto">
          <Link to="/auth">Create your own shop</Link>
        </Button>
      </div>
    </div>
  );
}

export function DemoShopPage() {
  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <PublicProfile data={DEMO_SHOP} theme="light" showBranding demoMode />
    </div>
  );
}
