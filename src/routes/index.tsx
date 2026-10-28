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
      { title: "izzy — One link for your links or your shop" },
      { name: "description", content: "One page for your links, or for your shop products and services. Share it, and customers message you on WhatsApp to order or book." },
      { property: "og:title", content: "izzy — Link in bio for creators" },
      { property: "og:description", content: "One page for your links, or for your shop products and services. Customers message you on WhatsApp." },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "1", t: "Create your link", d: "Pick a username. That is your page address." },
  { n: "2", t: "Add links, or shop products and services", d: "Add links for a link page, or add products with photos and prices and services for a store page. Your shop lives at yourname/shop." },
  { n: "3", t: "Share it — customers message you on WhatsApp", d: "Put the link in your bio. Buyers tap a product and order on WhatsApp. No payment is taken here." },
];

const FEATURES = [
  { icon: IndianRupee, t: "UPI payments", d: "Show a QR and tap-to-pay link. Get paid directly." },
  { icon: MessageCircle, t: "WhatsApp me", d: "One tap to chat — perfect for orders and enquiries." },
  { icon: Palette, t: "8 themes", d: "Light, dark and 6 inspired presets." },
  { icon: BarChart3, t: "Analytics", d: "See views and which links get clicked." },
  { icon: QrCode, t: "QR code", d: "Print it on your shop counter or packaging." },
  { icon: Zap, t: "Super fast", d: "Loads instantly, even on 4G." },
];

const SHOWCASE = [
  { title: "Chocolate cake", shop: "Priya's Kitchen", price: "₹499", grad: "from-amber-100 via-orange-100 to-rose-100", h: "h-56", initial: "C", img: "/examples/chocolate-cake.webp" },
  { title: "Handmade candle", shop: "Glow Studio", price: "₹299", grad: "from-yellow-100 via-amber-100 to-orange-100", h: "h-40", initial: "G", img: "/examples/handmade-candle.webp" },
  { title: "Sourdough loaf", shop: "Bake House", price: "₹199", grad: "from-stone-100 via-amber-50 to-yellow-100", h: "h-48", initial: "S", img: "/examples/sourdough-loaf.webp" },
  { title: "Ceramic mug", shop: "Clay & Co", price: "₹449", grad: "from-sky-100 via-teal-50 to-emerald-100", h: "h-64", initial: "M", img: "/examples/ceramic-mug.webp" },
  { title: "Face serum", shop: "Glow Lab", price: "₹599", grad: "from-rose-100 via-pink-50 to-orange-100", h: "h-44", initial: "F", img: "/examples/face-serum.webp" },
  { title: "Tote bag", shop: "Thread Studio", price: "₹349", grad: "from-emerald-100 via-lime-50 to-yellow-100", h: "h-52", initial: "T", img: "/examples/tote-bag.webp" },
];

const DEMO = {
  display_name: "Priya's Kitchen", username: "priya", bio: "Homemade tiffins in Pune 🍛 Order by 10am for lunch", avatar_url: null,
  socials: {}, whatsapp: null, upi_id: null,
  links: [{ id: "1", title: "This week's menu", url: "#" }, { id: "2", title: "Order on Swiggy", url: "#" }, { id: "3", title: "Watch my recipes", url: "#" }],
};

function Landing() {
  const { t } = useLang();
  const region = useRegion();
  return (
    <div className="min-h-screen">
      <div className="bg-hero">
        <SiteHeader />
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="mx-auto mt-4 max-w-xl text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:mx-0">{t.tagline}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground lg:mx-0">{t.sub}</p>
            <Link to="/auth" className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-full bg-primary px-7 text-lg font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 sm:inline-flex sm:w-auto">{t.create} →</Link>
            <p className="mt-3 text-base text-muted-foreground">Free to start · No card needed · One link for everything</p>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
              <div className="pointer-events-none h-[600px] overflow-hidden"><PublicProfile data={DEMO} theme="marigold" showBranding={false} compact /></div>
            </div>
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">Example page — yours will look like this</p>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-left text-3xl font-extrabold sm:text-center">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[28px] border bg-card p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">{s.n}</span>
              <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="mt-1 text-base text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-center text-3xl font-extrabold">Beautiful shops, made in minutes</h2>
        <p className="mt-3 text-center text-base text-muted-foreground">Example pages — browse like this, then make your own.</p>
        <div className="mt-10 columns-2 gap-4 sm:columns-3">
          {SHOWCASE.map((s) => (
            <div key={s.title} className="mb-4 break-inside-avoid overflow-hidden rounded-[24px] border bg-card shadow-pin">
              {s.img ? (
                <img src={s.img} alt={s.title} loading="lazy" className={`${s.h} w-full object-cover`} />
              ) : (
                <div className={`flex ${s.h} items-center justify-center bg-gradient-to-br ${s.grad}`}>
                  <span className="text-5xl font-extrabold text-foreground/30">{s.initial}</span>
                </div>
              )}
              <div className="p-4">
                <p className="text-base font-semibold leading-snug">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.shop}</p>
                <p className="mt-1 text-base font-bold">{s.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-left text-3xl font-extrabold sm:text-center">Everything a small business needs</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-[28px] border bg-card p-6 shadow-sm">
              <f.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 text-lg font-bold">{f.t}</h3>
              <p className="mt-1 text-base text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-left text-3xl font-extrabold sm:text-center">Free vs Pro</h2>
        <p className="mt-3 text-center text-sm font-medium text-muted-foreground">{testingBanner(region)}</p>
        <div className="mt-8">
          <PricingCards
            region={region}
            freeCta={<Link to="/auth" className="flex min-h-[48px] items-center justify-center rounded-xl border text-base font-semibold">Start free</Link>}
            proCta={<Link to="/auth" className="flex min-h-[48px] items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">Go Pro</Link>}
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
