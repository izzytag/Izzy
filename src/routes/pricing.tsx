import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCards } from "@/components/PricingCards";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — izzy | Free or $1/month" },
      { name: "description", content: "Start free with 5 links. Go Pro for $1/month: unlimited links, all themes, no branding, full analytics." },
      { property: "og:title", content: "izzy pricing — Free or $1/month" },
      { property: "og:description", content: "Unlimited links, all themes and no branding for $1/month." },
    ],
  }),
  component: Pricing,
});

const cta = (label: string, primary = false) => (
  <Link to="/auth" className={`block rounded-xl py-3 text-center font-semibold ${primary ? "bg-primary text-primary-foreground" : "border"}`}>{label}</Link>
);

function Pricing() {
  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-center text-4xl font-extrabold">Simple pricing</h1>
        <p className="mt-3 text-center text-muted-foreground">One price, everywhere. No surprises.</p>
        <div className="mt-10"><PricingCards freeCta={cta("Start free")} proCta={cta("Go Pro", true)} /></div>
      </main>
    </div>
  );
}
