import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { proPriceLine, testingBanner } from "@/lib/billing";
import { useRegion } from "@/lib/useRegion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — izzy | Free or Pro" },
      { name: "description", content: "Start free with 5 products and services. Go Pro (monthly): unlimited products and services, all themes, no branding, full analytics." },
      { property: "og:title", content: "izzy pricing — Free or Pro" },
      { property: "og:description", content: "Unlimited products and services, all themes and no branding (Pro, monthly)." },
    ],
  }),
  component: Pricing,
});

const cta = (label: string, primary = false) => (
  <Link to="/auth" className={`flex min-h-[52px] items-center justify-center rounded-xl text-lg font-semibold ${primary ? "bg-primary text-primary-foreground" : "border"}`}>{label}</Link>
);

const BILLING_FAQ = [
  {
    q: "How does billing work?",
    a: "In India, Pro is ₹99/month through Razorpay — pay by card, UPI or netbanking, and your subscription renews automatically each month until you cancel. Outside India, Pro is $1/month and checkout is coming soon.",
  },
  {
    q: "When does my subscription renew?",
    a: "Every month, on the same cycle as your first payment. The Plan page in your dashboard shows your current period end — while your subscription is active, that's the day it renews.",
  },
  {
    q: "How do I cancel?",
    a: "Any time from your dashboard: Plan & billing → Cancel subscription. Cancellation takes effect at the end of your paid period, so you keep Pro until then and there's no charge after that. There's no refund for the current period.",
  },
  {
    q: "What happens when Pro ends?",
    a: "Your shop moves back to Free and nothing is deleted — all your products and services stay live. If you have more than 5, you just can't add new ones until you're under the Free limit or back on Pro. Pro themes stop applying, the \"Made with Izzy\" footer returns, and analytics goes back to the last 7 days.",
  },
  {
    q: "Is there an annual plan or a discount?",
    a: "No — Pro is monthly only, at one simple price. There are no setup fees and no discounts to chase.",
  },
  {
    q: "What if a payment goes wrong?",
    a: "Pro only activates after Razorpay confirms your payment on our server — a failed payment never activates Pro and is never charged as a subscription. If a charge looks wrong or Pro didn't switch on after a successful payment, contact us and we'll sort it out.",
  },
];

function Pricing() {
  const region = useRegion();
  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-4xl font-extrabold sm:text-center">Simple pricing</h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-center">{proPriceLine(region)} for Pro. No surprises.</p>
        <p className="mt-2 text-center text-sm font-medium text-muted-foreground">{testingBanner(region)}</p>
        <div className="mt-10"><PricingCards region={region} freeCta={cta("Start free")} proCta={cta("Go Pro", true)} /></div>
        <section className="mt-14">
          <h2 className="text-2xl font-bold sm:text-center">Billing questions</h2>
          <Accordion type="single" collapsible className="mt-6">
            {BILLING_FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="border-border">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-center">
            The full terms are in our <Link to="/terms" className="font-semibold text-primary underline">Terms</Link>.
            Still stuck? <Link to="/contact" className="font-semibold text-primary underline">Contact us</Link> and we&apos;ll help.
          </p>
        </section>
      </main>
    </div>
  );
}
