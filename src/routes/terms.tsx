import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — izzy" },
      { name: "description", content: "The rules for using izzy." },
      { property: "og:title", content: "Terms of Service — izzy" },
      { property: "og:description", content: "The rules for using izzy." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-hero"><SiteHeader /></div>
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground">Your page</h2>
            <p className="mt-2">You are responsible for the content you publish on your Izzy page. Don't use it for anything illegal, misleading, spammy or harmful. We may remove pages that break these rules.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Plans</h2>
            <p className="mt-2">The Free plan includes up to 5 links, Light and Dark themes, 7-day analytics and a "Made with Izzy" footer. Pro is $1/month and includes unlimited links, all themes, 30-day analytics and no branding. Pro subscriptions renew monthly and can be cancelled anytime; access continues until the end of the paid period.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Payments you receive</h2>
            <p className="mt-2">UPI payments happen directly between your visitors and your UPI account. izzy never holds or processes that money and is not responsible for those transactions.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Availability</h2>
            <p className="mt-2">We work hard to keep izzy fast and online, but we can't guarantee uninterrupted service. We may update these terms; continued use means you accept the latest version.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
