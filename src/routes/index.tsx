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
import { Section, SectionHeading } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { captureReferralFromSearch } from "@/lib/referral";
import { faqPageJsonLd, seoHead } from "@/lib/seo";
import { useRegion } from "@/lib/useRegion";
import type { ThemeId } from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    ...seoHead({
      title: "izzy — Your business. Your products. One shop link.",
      description: "Create your online shop, showcase your products and receive orders directly through WhatsApp. No technical skills required.",
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

export const HERO_SHOP = demoShop("Priya's Kitchen", "priya", "Homemade cakes and tiffins in Pune. Order by 10am for lunch.", "/examples/priya-logo.webp", [
  ["Chocolate cake", "₹499", "Rich Belgian chocolate, baked fresh to order.", "/examples/chocolate-cake.webp"],
  ["Sourdough loaf", "₹199", "Slow-fermented, crusty and fresh every morning.", "/examples/sourdough-loaf.webp"],
  ["Chocolate cake (1 kg)", "₹899", "The same Belgian chocolate cake, baked as a 1 kg celebration cake.", "/examples/priya-cake-1kg.webp"],
  ["Sourdough loaf (pack of 2)", "₹349", "Two slow-fermented loaves, baked fresh every morning.", "/examples/priya-sourdough-two.webp"],
]);

export const SHOWCASE: { label: string; theme: ThemeId; data: PublicData }[] = [
  {
    label: "Fashion boutique", theme: "rose",
    data: demoShop("Thread Studio", "threadstudio", "Handmade totes, gifts & everyday fashion", "/examples/tote-bag.webp", [
      ["Canvas tote bag", "₹349", "Sturdy everyday tote with an inner pocket.", "/examples/tote-bag.webp"],
      ["Canvas tote bag, large", "₹449", "A larger everyday tote with an inner pocket.", "/examples/tote-bag.webp"],
      ["Canvas tote bag, mini", "₹249", "A compact tote for everyday essentials.", "/examples/tote-bag.webp"],
    ]),
  },
  {
    label: "Food & bakery", theme: "marigold",
    data: demoShop("Priya's Kitchen", "priyaskitchen", "Homemade cakes and tiffins in Pune. Order by 10am for lunch.", "/examples/priya-logo.webp", [
      ["Chocolate cake", "₹499", "Rich Belgian chocolate, baked fresh to order.", "/examples/chocolate-cake.webp"],
      ["Sourdough loaf", "₹199", "Slow-fermented, crusty and fresh every morning.", "/examples/sourdough-loaf.webp"],
      ["Chocolate cake (1 kg)", "₹899", "The same Belgian chocolate cake, baked as a 1 kg celebration cake.", "/examples/priya-cake-1kg.webp"],
    ]),
  },
  {
    label: "Beauty & lifestyle", theme: "mint",
    data: demoShop("Glow Lab", "glowlab", "Clean skincare & self-care essentials", "/examples/face-serum.webp", [
      ["Face serum", "₹599", "Vitamin C serum for a daily glow.", "/examples/face-serum.webp"],
      ["Soy candle", "₹299", "Lavender and vanilla soy candle, hand-poured.", "/examples/handmade-candle.webp"],
      ["Face serum (50 ml)", "₹899", "Vitamin C serum for a daily glow, in a larger bottle.", "/examples/face-serum.webp"],
    ]),
  },
];

/** Static phone-frame mockup of a live storefront (illustration only —
    the whole frame is non-interactive, exactly like a product photo).
    No WhatsApp button inside the frame: the mockup is a static
    illustration, and a floating button would cover catalogue cards. */
function PhoneMockup({ data, theme, height }: { data: PublicData; theme: ThemeId; height: number }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
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
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:px-8 lg:pb-24">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
              For small businesses, creators &amp; local shops
            </span>
            <h1 className="mx-auto mt-6 max-w-xl text-[2.75rem] font-bold leading-[1.08] tracking-tight sm:text-6xl lg:mx-0">Your business deserves more than an Instagram bio.</h1>
            <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-muted-foreground lg:mx-0">Create your own online shop, showcase your products and get orders directly on WhatsApp.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="min-h-[52px] text-base">
                <Link to="/auth">Create your free shop</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[52px] text-base">
                <a href="#examples">See shop designs</a>
              </Button>
            </div>
            <p className="mt-4 text-base text-muted-foreground">Free to start · No card needed · Set up in minutes</p>
          </div>
          <div>
            <PhoneMockup data={HERO_SHOP} theme="light" height={600} />
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <Section id="how-it-works">
        <SectionHeading title="Your online shop in three simple steps." />
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-lg font-bold text-muted-foreground">{s.n}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- Storefront showcase ---------- */}
      <Section id="examples" className="bg-card">
        <SectionHeading
          title="A beautiful shop that represents your business."
          sub="Shops built with izzy, across different kinds of businesses."
        />
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE.map((s) => (
            <figure key={s.label}>
              <PhoneMockup data={s.data} theme={s.theme} height={480} />
              <figcaption className="mt-4 text-center">
                <span className="text-base font-semibold">{s.data.display_name}</span>
                <span className="block text-sm text-muted-foreground">{s.label}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="min-h-[52px] text-base">
            <Link to="/demo">Try a demo shop</Link>
          </Button>
        </div>
      </Section>

      {/* ---------- Features ---------- */}
      <Section id="features">
        <SectionHeading title="Everything you need to showcase your products." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-xl border border-border bg-card p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{f.t}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- WhatsApp ordering ---------- */}
      <Section className="bg-card">
        <SectionHeading
          title="Your customers are already on WhatsApp. Meet them there."
        />
        <div className="mx-auto mt-12 max-w-md rounded-xl border border-border bg-background p-5" aria-label="WhatsApp conversation">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">P</span>
            <div>
              <p className="text-base font-semibold leading-tight">Priya's Kitchen</p>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-card p-3.5 leading-relaxed shadow-none">
              Hi! I&apos;m interested in &quot;Chocolate cake&quot; (₹499) listed on Priya&apos;s Kitchen&apos;s izzy shop. Could you please share more details?
              <span className="mt-1 block text-sm text-muted-foreground">This message is written for the customer — they just tap send.</span>
            </p>
            <p className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-whatsapp/10 p-3.5 leading-relaxed">
              Hi, thank you! When would you like it delivered?
            </p>
          </div>
          <p className="pt-4 text-center text-sm text-muted-foreground">You and your customer talk directly.</p>
        </div>
      </Section>

      {/* ---------- Pricing ---------- */}
      <Section id="pricing">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Simple, honest pricing." sub="Start free. Upgrade when your shop grows — cancel anytime." />
          <div className="mt-10">
            <PricingCards
              region={region}
              freeCta={<Button asChild variant="outline" className="min-h-[48px] w-full text-base"><Link to="/auth">Start free</Link></Button>}
              proCta={<Button asChild className="min-h-[48px] w-full text-base"><Link to="/auth">Go Pro</Link></Button>}
            />
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section className="bg-card">
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
      </Section>

      {/* ---------- Final CTA ---------- */}
      <Section>
        <div className="rounded-xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Your products deserve their own space.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary-foreground/85">Create your shop and start sharing your products with the world.</p>
          <Button asChild size="lg" className="mt-9 min-h-[52px] bg-white text-primary hover:bg-white/90">
            <Link to="/auth">Create your free shop</Link>
          </Button>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
