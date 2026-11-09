import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — izzy" },
      { name: "description", content: "How izzy collects, uses and protects your data." },
      { property: "og:title", content: "Privacy Policy — izzy" },
      { property: "og:description", content: "How izzy collects, uses and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-hero"><SiteHeader /></div>
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground">What we collect</h2>
            <p className="mt-2">When you sign up we store your email address. When you build your page we store the profile details you enter: name, bio, photo, links, social handles, WhatsApp number and UPI ID. We also count page views and link clicks on your public page so we can show you analytics.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">How we use it</h2>
            <p className="mt-2">Your profile details are shown on your public page, which is visible to anyone with the link. Analytics are shown only to you in your dashboard. We never sell your data or use it for advertising.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Payments</h2>
            <p className="mt-2">Pro subscriptions are processed by Razorpay. We never see or store your card or UPI credentials.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Your choices</h2>
            <p className="mt-2">You can edit or remove any profile detail at any time from your dashboard. To delete your account and all associated data, contact us via the Contact page.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
