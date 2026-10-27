import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";
import { PRO_PRICE_DISPLAY_LINE, TESTING_BANNER } from "@/lib/billing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — izzy | Free or Pro" },
      { name: "description", content: `Start free with 5 links. Go Pro (${PRO_PRICE_DISPLAY_LINE}): unlimited links, all themes, no branding, full analytics.` },
      { property: "og:title", content: "izzy pricing — Free or Pro" },
      { property: "og:description", content: `Unlimited links, all themes and no branding (${PRO_PRICE_DISPLAY_LINE}).` },
    ],
  }),
  component: Pricing,
});

const cta = (label: string, primary = false) => (
  <Link to="/auth" className={`flex min-h-[52px] items-center justify-center rounded-xl text-lg font-semibold ${primary ? "bg-primary text-primary-foreground" : "border"}`}>{label}</Link>
);

function Pricing() {
  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-4xl font-extrabold sm:text-center">Simple pricing</h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-center">{PRO_PRICE_DISPLAY_LINE}. No surprises.</p>
        <p className="mt-2 text-center text-sm font-medium text-muted-foreground">{TESTING_BANNER}</p>
        <div className="mt-10"><PricingCards freeCta={cta("Start free")} proCta={cta("Go Pro", true)} /></div>
      </main>
    </div>
  );
}
