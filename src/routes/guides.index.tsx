import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Instagram, MessageCircle } from "lucide-react";
import { Section, SectionHeading } from "@/components/Section";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Guides — izzy | Practical help for selling online" },
      { name: "description", content: "Short, practical guides for small businesses: sell on WhatsApp with a shop link, and turn your Instagram bio link into enquiries." },
      { property: "og:title", content: "izzy guides — practical help for selling online" },
      { property: "og:description", content: "Sell on WhatsApp with a shop link, and turn your Instagram bio link into enquiries." },
    ],
  }),
  component: GuidesIndex,
});

const GUIDES = [
  {
    to: "/guides/sell-on-whatsapp" as const,
    icon: MessageCircle,
    label: "WhatsApp selling",
    title: "How to sell on WhatsApp with a shop link",
    summary:
      "Set up your shop once, share one link, and let customers browse your products and prices before they message you — no more sending the same photos and price lists again and again.",
  },
  {
    to: "/guides/instagram-bio-link" as const,
    icon: Instagram,
    label: "Instagram",
    title: "Your Instagram bio link: turn followers into enquiries",
    summary:
      "Your bio gets one link. Make it a shop page that shows your products and prices and ends in a WhatsApp conversation — instead of another list of links or a “DM to order” dead end.",
  },
];

function GuidesIndex() {
  return (
    <Section className="py-14 sm:py-20">
      <SectionHeading
        title="Guides for selling online"
        sub="Practical, no-jargon help for small businesses, creators and local shops — written around how your customers already buy: through WhatsApp."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className="group rounded-xl border bg-card p-6 transition hover:border-primary/40"
          >
            <g.icon className="h-7 w-7 text-primary" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
            <h2 className="mt-1.5 text-xl font-bold leading-snug">{g.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{g.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">
              Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
