import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutGrid, Link2, MessageCircle,
  PackagePlus, Palette, Store,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PricingCards } from "@/components/PricingCards";
import { PublicProfile, type PublicData } from "@/components/PublicProfile";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeading } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DEMO_GLOW_LAB, DEMO_PRIYA, DEMO_THREAD_STUDIO } from "@/lib/demo-shops";
import { captureReferralFromSearch } from "@/lib/referral";
import { faqPageJsonLd, seoHead } from "@/lib/seo";
import { useRegion } from "@/lib/useRegion";
import type { ThemeId } from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    // SEO title/description target the searches sellers actually
    // type — "online shop India", "sell on WhatsApp", home bakers
    // and handmade sellers. The visible H1 and page copy are
    // unchanged; only the search-facing title/description move.
    ...seoHead({
      title: "Create your online shop in India — sell on WhatsApp | izzy",
      description: "Create a free online shop for your home bakery, handmade products or local store. Add photos and prices, share one link, and take orders on WhatsApp — no website needed.",
      path: "/",
    }),
    // Structured data: only facts — the platform's name, URL and
    // logo, plus the FAQ content rendered on this page. No ratings
    // or reviews are claimed anywhere.
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: "izzy", url: "https://izzytag.shop/", logo: "https://izzytag.shop/favicon.png" },
            { "@type": "WebSite", name: "izzy", url: "https://izzytag.shop/" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: faqPageJsonLd(FAQS),
      },
    ],
  }),
  component: Landing,
});

/* ---------- Demo shops: original demo content rendered by the real
   storefront component, using the site's own example photos. ---------- */

function demoShop(name: string, username: string, bio: string, avatar: string, items: [string, string, string, string][]): PublicData {
  return {
    display_name: name, username, bio, avatar_url: avatar, socials: {}, whatsapp: null, upi_id: null,
    links: items.map(([title, price, description, img], i) => ({
      id: `${username}-${i}`, title, url: "#", kind: "product", price, description, image_urls: [img], category: null,
    })),
  };
}

export const HERO_SHOP = demoShop("Cake Factory", "priya", "Homemade cakes and tiffins in Pune. Order by 10am for lunch.", "/examples/priya-logo.webp", [
  ["Chocolate cake", "₹499", "Rich Belgian chocolate, baked fresh to order.", "/examples/chocolate-cake.webp"],
  ["Sourdough loaf", "₹199", "Slow-fermented, crusty and fresh every morning.", "/examples/sourdough-loaf.webp"],
  ["Chocolate cake (1 kg)", "₹899", "The same Belgian chocolate cake, baked as a 1 kg celebration cake.", "/examples/priya-cake-1kg.webp"],
  ["Sourdough loaf (pack of 2)", "₹349", "Two slow-fermented loaves, baked fresh every morning.", "/examples/priya-sourdough-two.webp"],
]);

export const SHOWCASE: { label: string; theme: ThemeId; data: PublicData; demoPath: string }[] = [
  {
    label: "Fashion boutique", theme: "rose",
    data: DEMO_THREAD_STUDIO,
    demoPath: "/demo/thread-studio",
  },
  {
    label: "Food & bakery", theme: "marigold",
    data: DEMO_PRIYA,
    demoPath: "/demo",
  },
  {
    label: "Beauty & lifestyle", theme: "mint",
    data: DEMO_GLOW_LAB,
    demoPath: "/demo/glow-lab",
  },
];

/** Static phone-frame mockup of a live storefront (illustration only —
    the whole frame is non-interactive, exactly like a product photo).
    No WhatsApp button inside the frame: the mockup is a static
    illustration, and a floating button would cover catalogue cards. */
function PhoneMockup({ data, theme, height }: { data: PublicData; theme: ThemeId; height: number }) {
  return (
    <div className="anim-float relative mx-auto w-full max-w-[320px]">
      <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-foreground bg-card shadow-soft">
        <div className="pointer-events-none overflow-hidden" style={{ height }} aria-hidden>
          <PublicProfile data={data} theme={theme} showBranding={false} compact />
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { n: "01", icon: Store, t: "Create your shop", d: "Set up your business profile in minutes." },
  { n: "02", icon: PackagePlus, t: "Add your products", d: "Upload photos, descriptions and prices." },
  { n: "03", icon: MessageCircle, t: "Start receiving orders", d: "Share your shop link and receive enquiries directly on WhatsApp." },
];

const FEATURES = [
  { icon: LayoutGrid, t: "Beautiful online catalog", d: "A clean catalog with photos, descriptions and prices — add, edit, reorder or draft products anytime from your dashboard, and changes go live instantly. No website building, no code." },
  { icon: MessageCircle, t: "Direct WhatsApp ordering", d: "Customers tap Order on a product and reach you on WhatsApp with the product already in the message." },
  { icon: Link2, t: "One link and a QR code", d: "One link — izzytag.shop/yourname — for your Instagram bio, stories, status and everywhere else, plus a QR code for your counter, packaging or posters." },
  { icon: Palette, t: "Shop customization", d: "Eight themes, your logo, your bio — a shop that looks like your business, not a template." },
];

const FAQS = [
  { q: "What is izzy?", a: "izzy is a simple way for small businesses, creators, resellers and local shops to sell online. You create a shop page with your products and prices, share one link, and customers order through WhatsApp. No website, no technical skills needed." },
  { q: "How do I create my online shop?", a: "Sign up free, pick your shop name (your link becomes izzytag.shop/yourname), add your business name and logo, then add products with photos and prices. Most shops are ready to share in a few minutes." },
  { q: "Does izzy process payments?", a: "No. izzy never touches the money for your orders: customers pay you directly — UPI, cash, bank transfer, whatever you both agree on WhatsApp. (If you choose an izzy Pro subscription, that subscription is billed separately.)" },
  { q: "Can I edit my products later?", a: "Anytime. From your dashboard you can change prices, photos and descriptions, hide a product, or prepare new products as drafts and switch them on when you're ready. Changes appear on your shop straight away." },
];

export function Landing() {
  const region = useRegion();
  // Referral capture: arriving via ?ref=<username> stores a first-touch
  // capture (username + timestamp) in localStorage. Attribution itself
  // happens server-side when the new account saves its profile.
  useEffect(() => {
    try {
      captureReferralFromSearch(window.location.search, window.localStorage, Date.now());
    } catch {
      // Storage unavailable — referral capture is best-effort.
    }
  }, []);
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ---------- Hero ---------- */}
      <section className="overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:px-8 lg:pb-28">
          <div className="text-center lg:text-left">
            <span className="anim-hero-1 inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
              For small businesses, creators &amp; local shops
            </span>
            <h1 className="anim-hero-2 mx-auto mt-6 max-w-xl text-[2.75rem] font-bold leading-[1.08] tracking-tight sm:text-6xl lg:mx-0">Your business deserves more than an Instagram bio.</h1>
            <p className="anim-hero-3 mx-auto mt-5 max-w-xl text-xl leading-relaxed text-muted-foreground lg:mx-0">Create your own online shop, showcase your products and get orders directly on WhatsApp.</p>
            <div className="anim-hero-4 mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="anim-press min-h-[52px] text-base">
                <Link to="/auth">Create your free shop</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="anim-press min-h-[52px] text-base">
                <a href="#examples">See shop designs</a>
              </Button>
            </div>
            <p className="anim-hero-5 mt-4 text-base text-muted-foreground">Free to start · No card needed · Set up in minutes</p>
          </div>
          <div>
            <PhoneMockup data={HERO_SHOP} theme="light" height={600} />
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <Section id="how-it-works" className="py-20 sm:py-28">
        <Reveal>
          <SectionHeading title="Your online shop in three simple steps." />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90} className="h-full">
                <div className="h-full rounded-xl border border-border bg-card p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-lg font-bold text-muted-foreground">{s.n}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------- Storefront showcase ----------
          Listing-style cards: one big photo, the shop name and kind,
          a quiet bio line, and a single action — the whole card opens
          the demo shop. */}
      <Section id="examples" className="bg-card py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            title="A beautiful shop that represents your business."
            sub="Shops built with izzy, across different kinds of businesses."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE.map((s, i) => {
              const photo = s.data.links[0]?.image_urls?.[0] ?? s.data.avatar_url ?? "";
              const photoAlt = s.data.links[0]?.title ?? s.data.display_name ?? "";
              return (
                <Reveal key={s.label} delay={i * 90} className="h-full">
                  <Link to={s.demoPath} className="block h-full overflow-hidden rounded-3xl border border-border bg-card shadow-pin transition-transform duration-300 hover:-translate-y-1">
                    <img src={photo} alt={photoAlt} className="aspect-[4/3] w-full object-cover" />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold">{s.data.display_name}</h3>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">{s.label}</p>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{s.data.bio}</p>
                      <span className="mt-4 inline-flex items-center gap-1 font-semibold text-primary">
                        View demo shop <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Reveal>
      </Section>

      {/* ---------- Features ---------- */}
      <Section id="features" className="py-20 sm:py-28">
        <Reveal>
          <SectionHeading title="Everything you need to showcase your products." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 90} className="h-full">
                <div className="h-full rounded-xl border border-border bg-card p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{f.t}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------- WhatsApp ordering ---------- */}
      <Section className="bg-card py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            title="Your customers are already on WhatsApp. Meet them there."
          />
          <div className="mx-auto mt-12 max-w-md rounded-xl border border-border bg-background p-5" aria-label="WhatsApp conversation">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">C</span>
            <div>
              <p className="text-base font-semibold leading-tight">Cake Factory</p>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-card p-3.5 leading-relaxed shadow-none">
              Hi! I&apos;m interested in &quot;Chocolate cake&quot; (₹499) listed on Cake Factory&apos;s izzy shop. Could you please share more details?
              <span className="mt-1 block text-sm text-muted-foreground">This message is written for the customer — they just tap send.</span>
            </p>
            <p className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-whatsapp/10 p-3.5 leading-relaxed">
              Hi, thank you! When would you like it delivered?
            </p>
          </div>
          <p className="pt-4 text-center text-sm text-muted-foreground">You and your customer talk directly.</p>
        </div>
        </Reveal>
      </Section>

      {/* ---------- Pricing ---------- */}
      <Section id="pricing" className="py-20 sm:py-28">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <SectionHeading title="Simple, honest pricing." sub="Start free. Upgrade when your shop grows — cancel anytime." />
            <div className="mt-10">
              <PricingCards
                region={region}
                freeCta={<Button asChild variant="outline" className="anim-press min-h-[48px] w-full text-base"><Link to="/auth">Start free</Link></Button>}
                proCta={<Button asChild className="anim-press min-h-[48px] w-full text-base"><Link to="/auth">Go Pro</Link></Button>}
              />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-card py-20 sm:py-28">
        <Reveal>
          <SectionHeading title="Questions, answered." />
          <div className="mx-auto mt-10 max-w-3xl">
            <Accordion type="single" collapsible>
              {FAQS.map((f) => (
                <AccordionItem key={f.q} value={f.q} className="border-border">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </Section>

      {/* ---------- Final CTA ---------- */}
      <Section className="py-20 sm:py-28">
        <Reveal>
          <div className="rounded-xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Your products deserve their own space.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary-foreground/85">Create your shop and start sharing your products with the world.</p>
            <Button asChild size="lg" className="anim-press mt-9 min-h-[52px] bg-white text-primary hover:bg-white/90">
              <Link to="/auth">Create your free shop</Link>
            </Button>
          </div>
        </Reveal>
      </Section>

      <SiteFooter />
    </div>
  );
}
