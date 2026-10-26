import { createFileRoute, Link } from "@tanstack/react-router";
import { IndianRupee, MessageCircle, BarChart3, Palette, QrCode, Zap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { PublicProfile } from "@/components/PublicProfile";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "izzy — Link in bio for creators, $1/month" },
      { name: "description", content: "One link for your Instagram bio with WhatsApp, UPI payments, themes and analytics. Free to start, Pro at $1/month." },
      { property: "og:title", content: "izzy — Link in bio for creators" },
      { property: "og:description", content: "WhatsApp, UPI and all your links on one page. Free or $1/month." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: IndianRupee, t: "UPI payments", d: "Show a QR and tap-to-pay link. Get paid directly." },
  { icon: MessageCircle, t: "WhatsApp me", d: "One tap to chat — perfect for orders and enquiries." },
  { icon: Palette, t: "8 themes", d: "Light, dark and 6 inspired presets." },
  { icon: BarChart3, t: "Analytics", d: "See views and which links get clicked." },
  { icon: QrCode, t: "QR code", d: "Print it on your shop counter or packaging." },
  { icon: Zap, t: "Super fast", d: "Loads instantly, even on 4G." },
];

const DEMO = {
  display_name: "Priya's Kitchen", username: "priya", bio: "Homemade tiffins in Pune 🍛 Order by 10am for lunch", avatar_url: null,
  socials: {}, whatsapp: null, upi_id: null,
  links: [{ id: "1", title: "This week's menu", url: "#" }, { id: "2", title: "Order on Swiggy", url: "#" }, { id: "3", title: "Watch my recipes", url: "#" }],
};

function Landing() {
  const { t } = useLang();
  return (
    <div className="min-h-screen">
      <div className="bg-hero">
        <SiteHeader />
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground">For creators everywhere · $1/month Pro</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-6xl">{t.tagline}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t.sub}</p>
            <Link to="/auth" className="mt-8 inline-block rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5">{t.create} →</Link>
            <p className="mt-3 text-sm text-muted-foreground">Free forever plan · No card needed</p>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground shadow-soft">
              <div className="pointer-events-none h-[520px] overflow-hidden"><PublicProfile data={DEMO} theme="marigold" showBranding={false} compact /></div>
            </div>
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">Example page — yours will look like this</p>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold">Everything a small business needs</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-3xl border bg-card p-6">
              <f.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-bold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-center text-3xl font-extrabold">Free vs Pro</h2>
        <div className="mt-8">
          <PricingCards
            freeCta={<Link to="/auth" className="block rounded-xl border py-3 text-center font-semibold">Start free</Link>}
            proCta={<Link to="/auth" className="block rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">Go Pro</Link>}
          />
        </div>
      </section>
      <footer className="border-t py-8">
        <nav className="flex justify-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <p className="mt-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} izzy</p>
      </footer>
    </div>
  );
}
