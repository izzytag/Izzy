import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3, LayoutGrid, Link2, MessageCircle, MessagesSquare, MousePointerClick,
  PackagePlus, Palette, QrCode, Search, Store, Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { PricingCards } from "@/components/PricingCards";
import { PublicProfile, type PublicData } from "@/components/PublicProfile";
import { Section, SectionHeading } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLang } from "@/lib/i18n";
import { testingBanner } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import type { ThemeId } from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "izzy — Your business. Your products. One beautiful link." },
      { name: "description", content: "Create your online shop, showcase your products and receive orders directly through WhatsApp. No technical skills required." },
      { property: "og:title", content: "izzy — Your business. Your products. One beautiful link." },
      { property: "og:description", content: "Create your online shop, showcase your products and receive orders directly through WhatsApp. No technical skills required." },
    ],
  }),
  component: Landing,
});

/* ---------- Demo shops: original demo content rendered by the real
   storefront component, using the site's own example photos. ---------- */

function demoShop(name: string, username: string, bio: string, items: [string, string, string, string][]): PublicData {
  return {
    display_name: name, username, bio, avatar_url: null, socials: {}, whatsapp: null, upi_id: null,
    links: items.map(([title, price, description, img], i) => ({
      id: `${username}-${i}`, title, url: "#", kind: "product", price, description, image_urls: [img], category: null,
    })),
  };
}

const HERO_SHOP = demoShop("Priya's Kitchen", "priya", "Homemade cakes & tiffins in Pune 🍛 Order by 10am for lunch", [
  ["Chocolate cake", "₹499", "Rich Belgian chocolate, baked fresh to order.", "/examples/chocolate-cake.webp"],
  ["Handmade candle", "₹299", "Soy wax, sandalwood scent.", "/examples/handmade-candle.webp"],
  ["Sourdough loaf", "₹199", "Slow-fermented, crusty and fresh every morning.", "/examples/sourdough-loaf.webp"],
  ["Ceramic mug", "₹449", "Hand-thrown stoneware, each piece unique.", "/examples/ceramic-mug.webp"],
]);

const SHOWCASE: { label: string; theme: ThemeId; data: PublicData }[] = [
  {
    label: "Fashion boutique", theme: "rose",
    data: demoShop("Thread Studio", "threadstudio", "Handmade totes, gifts & everyday fashion", [
      ["Canvas tote bag", "₹349", "Sturdy everyday tote with an inner pocket.", "/examples/tote-bag.webp"],
      ["Ceramic mug", "₹449", "Hand-thrown stoneware, each piece unique.", "/examples/ceramic-mug.webp"],
      ["Scented candle", "₹299", "Soy wax, sandalwood scent.", "/examples/handmade-candle.webp"],
    ]),
  },
  {
    label: "Food & bakery", theme: "marigold",
    data: demoShop("Priya's Kitchen", "priyaskitchen", "Homemade cakes & tiffins in Pune 🍛 Order by 10am for lunch", [
      ["Chocolate cake", "₹499", "Rich Belgian chocolate, baked fresh to order.", "/examples/chocolate-cake.webp"],
      ["Sourdough loaf", "₹199", "Slow-fermented, crusty and fresh every morning.", "/examples/sourdough-loaf.webp"],
      ["Ceramic mug", "₹449", "Hand-thrown stoneware, each piece unique.", "/examples/ceramic-mug.webp"],
    ]),
  },
  {
    label: "Beauty & lifestyle", theme: "mint",
    data: demoShop("Glow Lab", "glowlab", "Clean skincare & self-care essentials", [
      ["Face serum", "₹599", "Vitamin C serum for a daily glow.", "/examples/face-serum.webp"],
      ["Handmade candle", "₹299", "Soy wax, sandalwood scent.", "/examples/handmade-candle.webp"],
      ["Canvas tote bag", "₹349", "Sturdy everyday tote with an inner pocket.", "/examples/tote-bag.webp"],
    ]),
  },
];

/** Static phone-frame mockup of a live storefront (illustration only —
    the whole frame is non-interactive, exactly like a product photo). */
function PhoneMockup({ data, theme, height, whatsappButton }: { data: PublicData; theme: ThemeId; height: number; whatsappButton?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-foreground bg-card shadow-soft">
        <div className="pointer-events-none overflow-hidden" style={{ height }} aria-hidden>
          <PublicProfile data={data} theme={theme} showBranding={false} compact />
        </div>
      </div>
      {whatsappButton && (
        <span aria-hidden className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-soft">
          <MessageCircle className="h-7 w-7" />
        </span>
      )}
    </div>
  );
}

const TRUST = [
  { icon: Zap, t: "Simple setup" },
  { icon: Link2, t: "Your own shop link" },
  { icon: MessageCircle, t: "Orders through WhatsApp" },
];

const STEPS = [
  { n: "01", icon: Store, t: "Create your shop", d: "Set up your business profile in minutes." },
  { n: "02", icon: PackagePlus, t: "Add your products", d: "Upload photos, descriptions and prices." },
  { n: "03", icon: MessageCircle, t: "Start receiving orders", d: "Share your shop link and receive enquiries directly on WhatsApp." },
];

const FEATURES = [
  { icon: LayoutGrid, t: "Beautiful online catalog", d: "A clean catalog with photos, descriptions and prices — no website building, no code." },
  { icon: MessageCircle, t: "Direct WhatsApp ordering", d: "Customers tap Order on a product and reach you on WhatsApp with the product already in the message." },
  { icon: PackagePlus, t: "Easy product management", d: "Add, edit, reorder or draft products anytime from your dashboard — changes go live instantly." },
  { icon: Link2, t: "Shareable shop link", d: "One link — izzytag.shop/yourname — for your Instagram bio, stories, status and everywhere else." },
  { icon: QrCode, t: "QR code sharing", d: "Put your shop's QR code on your counter, packaging or posters; customers scan and land in your shop." },
  { icon: Palette, t: "Shop customization", d: "Eight themes, your logo, your bio — a shop that looks like your business, not a template." },
  { icon: BarChart3, t: "Basic analytics", d: "See how many people visit your shop and which products they tap." },
];

const WA_STEPS = [
  { icon: Search, t: "Customer discovers a product", d: "They open your link and browse your catalog." },
  { icon: MousePointerClick, t: "They tap Order", d: "Every product carries its own WhatsApp order button." },
  { icon: MessageCircle, t: "WhatsApp opens, message ready", d: "The product name and link are already written for them." },
  { icon: MessagesSquare, t: "You take it from there", d: "Chat, confirm, and arrange payment and delivery directly." },
];

const FAQS = [
  { q: "What is izzy?", a: "izzy is a simple way for small businesses, creators, resellers and local shops to sell online. You create a shop page with your products and prices, share one link, and customers order through WhatsApp. No website, no technical skills needed." },
  { q: "How do I create my online shop?", a: "Sign up free, pick your shop name (your link becomes izzytag.shop/yourname), add your business name and logo, then add products with photos and prices. Most shops are ready to share in a few minutes." },
  { q: "Can customers order through WhatsApp?", a: "Yes — that's how ordering works on izzy. A customer taps Order on any product and WhatsApp opens with a prefilled message about that product, sent straight to your number." },
  { q: "Do I need technical knowledge?", a: "None at all. If you can post on Instagram and chat on WhatsApp, you can run an izzy shop. Everything is forms and buttons — no code, no setup help needed." },
  { q: "Can I share my shop on Instagram?", a: "Yes. Your shop link is made for your Instagram bio, and you can also share it in stories, posts and WhatsApp status — or print your shop's QR code for your counter and packaging." },
  { q: "Does izzy process payments?", a: "No. izzy never touches the money for your orders: customers pay you directly — UPI, cash, bank transfer, whatever you both agree on WhatsApp. (If you choose an izzy Pro subscription, that subscription is billed separately.)" },
  { q: "Can I edit my products later?", a: "Anytime. From your dashboard you can change prices, photos and descriptions, hide a product, or prepare new products as drafts and switch them on when you're ready. Changes appear on your shop straight away." },
];

function Landing() {
  const { t } = useLang();
  const region = useRegion();
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
            <h1 className="mx-auto mt-6 max-w-xl text-[2.75rem] font-bold leading-[1.08] tracking-tight sm:text-6xl lg:mx-0">{t.tagline}</h1>
            <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-muted-foreground lg:mx-0">{t.sub}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="min-h-[52px] text-base">
                <Link to="/auth">{t.createFree}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[52px] text-base">
                <a href="#examples">Explore demo shops</a>
              </Button>
            </div>
            <p className="mt-4 text-base text-muted-foreground">Free to start · No card needed · Set up in minutes</p>
          </div>
          <div>
            <PhoneMockup data={HERO_SHOP} theme="light" height={600} whatsappButton />
            <p className="mt-4 text-center text-sm text-muted-foreground">Example shop — yours will look like this</p>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-8 sm:flex-row sm:gap-12 sm:px-6 lg:px-8">
          {TRUST.map((item) => (
            <span key={item.t} className="flex items-center gap-2.5 text-base font-semibold">
              <item.icon className="h-5 w-5 text-primary" /> {item.t}
            </span>
          ))}
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
          sub="One product, many kinds of businesses. Each shop below is an example built with izzy."
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
      </Section>

      {/* ---------- Features ---------- */}
      <Section id="features">
        <SectionHeading title="Everything you need to showcase your products." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          sub="No new app for your customers to learn, and no inbox for you to check — the order lands in the WhatsApp you already use."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WA_STEPS.map((s, i) => (
            <div key={s.t} className="rounded-xl border border-border bg-background p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-whatsapp/10 text-whatsapp">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{i + 1}. {s.t}</h3>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-md rounded-xl border border-border bg-background p-5" aria-label="Example WhatsApp conversation">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">P</span>
            <div>
              <p className="text-base font-semibold leading-tight">Priya's Kitchen</p>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-card p-3.5 leading-relaxed shadow-none">
              Hi! I'd like to order: <span className="font-medium">Chocolate cake — ₹499</span>
              <span className="mt-1 block text-sm text-muted-foreground">This message is written for the customer — they just tap send.</span>
            </p>
            <p className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-whatsapp/10 p-3.5 leading-relaxed">
              Hi, thank you! 😊 When would you like it delivered?
            </p>
          </div>
          <p className="pt-4 text-center text-sm text-muted-foreground">An example conversation — you and your customer talk directly.</p>
        </div>
      </Section>

      {/* ---------- Pricing ---------- */}
      <Section id="pricing">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Simple, honest pricing." sub="Start free. Upgrade when your shop grows — cancel anytime." />
          <p className="mt-4 text-center text-sm font-medium text-muted-foreground">{testingBanner(region)}</p>
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
            <Link to="/auth">{t.createFree}</Link>
          </Button>
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">Your business. Your products. One beautiful link.</p>
            </div>
            <nav aria-label="Product">
              <h3 className="text-base font-semibold">Product</h3>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                <li><Link to="/" hash="features" className="transition-colors duration-200 hover:text-foreground">Features</Link></li>
                <li><Link to="/" hash="how-it-works" className="transition-colors duration-200 hover:text-foreground">How it works</Link></li>
                <li><Link to="/" hash="examples" className="transition-colors duration-200 hover:text-foreground">Examples</Link></li>
                <li><Link to="/pricing" className="transition-colors duration-200 hover:text-foreground">Pricing</Link></li>
              </ul>
            </nav>
            <nav aria-label="Support and legal">
              <h3 className="text-base font-semibold">Support &amp; legal</h3>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                <li><Link to="/contact" className="transition-colors duration-200 hover:text-foreground">Contact</Link></li>
                <li><Link to="/privacy" className="transition-colors duration-200 hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="transition-colors duration-200 hover:text-foreground">Terms</Link></li>
              </ul>
            </nav>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} izzy</p>
            <p>Your business. Your products. One beautiful link.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
