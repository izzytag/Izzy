import { createFileRoute, Link } from "@tanstack/react-router";
import { IndianRupee, MessageCircle, BarChart3, Palette, QrCode, Zap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { PublicProfile } from "@/components/PublicProfile";
import { useLang } from "@/lib/i18n";
import { testingBanner } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "izzy — Your shop in one link" },
      { name: "description", content: "Your whole catalogue in one link — products and services with photos and prices. Share it, and customers order on WhatsApp." },
      { property: "og:title", content: "izzy — Your shop in one link" },
      { property: "og:description", content: "Your whole catalogue in one link — products and services with photos and prices. Customers order on WhatsApp." },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "1", t: "Create your shop", d: "Pick a username. That is your shop address." },
  { n: "2", t: "Add your products", d: "Add products and services with photos and prices. Everything you add appears on your shop page." },
  { n: "3", t: "Share it — customers order on WhatsApp", d: "Put the link in your bio. Buyers tap a product and order on WhatsApp. No payment is taken here." },
];

const FEATURES = [
  { icon: IndianRupee, t: "UPI payments", d: "Show a QR and tap-to-pay link. Get paid directly." },
  { icon: MessageCircle, t: "WhatsApp me", d: "One tap to chat — perfect for orders and enquiries." },
  { icon: Palette, t: "8 themes", d: "Light, dark and 6 inspired presets." },
  { icon: BarChart3, t: "Analytics", d: "See views and which products get tapped." },
  { icon: QrCode, t: "QR code", d: "Print it on your shop counter or packaging." },
  { icon: Zap, t: "Super fast", d: "Loads instantly, even on 4G." },
];

const SHOWCASE = [
  { title: "Chocolate cake", shop: "Priya's Kitchen", price: "₹499", h: "h-56", img: "/examples/chocolate-cake.webp" },
  { title: "Handmade candle", shop: "Glow Studio", price: "₹299", h: "h-40", img: "/examples/handmade-candle.webp" },
  { title: "Sourdough loaf", shop: "Bake House", price: "₹199", h: "h-48", img: "/examples/sourdough-loaf.webp" },
  { title: "Ceramic mug", shop: "Clay & Co", price: "₹449", h: "h-64", img: "/examples/ceramic-mug.webp" },
  { title: "Face serum", shop: "Glow Lab", price: "₹599", h: "h-44", img: "/examples/face-serum.webp" },
  { title: "Tote bag", shop: "Thread Studio", price: "₹349", h: "h-52", img: "/examples/tote-bag.webp" },
];

// Hero phone demo: a static example shop (original demo content, the
// site's own example photos) rendered by the real storefront
// component — store header plus product cards with prices.
const DEMO = {
  display_name: "Priya's Kitchen", username: "priya", bio: "Homemade cakes & tiffins in Pune 🍛 Order by 10am for lunch", avatar_url: null,
  socials: {}, whatsapp: null, upi_id: null,
  links: [
    { id: "1", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate, baked fresh to order.", image_urls: ["/examples/chocolate-cake.webp"], category: "Cakes" },
    { id: "2", title: "Handmade candle", url: "#", kind: "product", price: "₹299", description: "Soy wax, sandalwood scent.", image_urls: ["/examples/handmade-candle.webp"], category: "Home" },
    { id: "3", title: "Sourdough loaf", url: "#", kind: "product", price: "₹199", description: "Slow-fermented, crusty and fresh every morning.", image_urls: ["/examples/sourdough-loaf.webp"], category: "Bakes" },
    { id: "4", title: "Ceramic mug", url: "#", kind: "product", price: "₹449", description: "Hand-thrown stoneware, each piece unique.", image_urls: ["/examples/ceramic-mug.webp"], category: "Home" },
  ],
};

function Landing() {
  const { t } = useLang();
  const region = useRegion();
  return (
    <div className="min-h-screen">
      <div>
        <SiteHeader />
        <section className="mx-auto grid max-w-[1100px] items-center gap-10 px-5 pb-20 pt-12 sm:pt-16 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="mx-auto mt-4 max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:mx-0">{t.tagline}</h1>
            <p className="mx-auto mt-5 max-w-xl text-xl text-muted-foreground lg:mx-0">{t.sub}</p>
            <Link to="/auth" className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-full bg-primary px-7 text-lg font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover sm:inline-flex sm:w-auto">{t.create} →</Link>
            <p className="mt-3 text-base text-muted-foreground">Free to start · No card needed · Set up in minutes</p>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
              <div className="pointer-events-none h-[600px] overflow-hidden"><PublicProfile data={DEMO} theme="marigold" showBranding={false} compact /></div>
            </div>
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">Example shop — yours will look like this</p>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-[1100px] px-5 py-16 sm:py-24">
        <h2 className="text-left text-3xl font-semibold sm:text-center sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[20px] border bg-card p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-base text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-16 sm:py-24">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Beautiful shops, made in minutes</h2>
        <p className="mt-3 text-center text-base text-muted-foreground">Example shops — browse like this, then make your own.</p>
        <div className="mt-10 columns-2 gap-5 sm:columns-3">
          {SHOWCASE.map((s) => (
            <div key={s.title} className="mb-5 break-inside-avoid overflow-hidden rounded-[20px] border bg-card">
              <img src={s.img} alt={s.title} loading="lazy" className={`${s.h} w-full object-cover`} />
              <div className="p-4">
                <p className="text-base font-semibold leading-snug">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.shop}</p>
                <p className="mt-1 text-base font-bold tabular-nums">{s.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-16 sm:py-24">
        <h2 className="text-left text-3xl font-semibold sm:text-center sm:text-4xl">Everything a small business needs</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-[20px] border bg-card p-6">
              <f.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-base text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="text-left text-3xl font-semibold sm:text-center sm:text-4xl">Free vs Pro</h2>
        <p className="mt-3 text-center text-sm font-medium text-muted-foreground">{testingBanner(region)}</p>
        <div className="mt-8">
          <PricingCards
            region={region}
            freeCta={<Link to="/auth" className="flex min-h-[48px] items-center justify-center rounded-full border border-input bg-card text-base font-semibold transition-colors duration-200 hover:bg-accent">Start free</Link>}
            proCta={<Link to="/auth" className="flex min-h-[48px] items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover">Go Pro</Link>}
          />
        </div>
      </section>
      <footer className="border-t py-8">
        <nav className="flex flex-wrap justify-center gap-2 text-base font-medium text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <p className="mt-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} izzy</p>
      </footer>
    </div>
  );
}
