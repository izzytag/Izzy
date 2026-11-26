import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Globe, LayoutGrid, Link2, MessageCircle } from "lucide-react";
import { Section } from "@/components/Section";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    ...seoHead({
      title: "Guides — izzy | Practical help for selling online",
      description:
        "Short, practical guides for small businesses: sell on WhatsApp with or without a website, set up your Instagram bio shop link, and create a free online catalogue.",
      path: "/guides",
      ogTitle: "izzy guides — practical help for selling online",
      ogDescription:
        "Sell on WhatsApp, set up your Instagram bio shop link, and create a free online catalogue.",
    }),
  }),
  component: GuidesIndex,
});

export const GUIDES = [
  {
    to: "/guides/create-online-shop-in-5-minutes" as const,
    icon: Clock,
    label: "Online shop",
    title: "Create Your Online Shop in 5 Minutes — Free, Without a Website",
    summary:
      "Create your online shop in India in 5 minutes: sign up free, add products with photos and prices, connect WhatsApp, and share one link. No website, no card needed.",
  },
  {
    to: "/guides/how-to-sell-online-in-india" as const,
    icon: Globe,
    label: "Selling online",
    title: "How to Sell Online in India: A Simple Guide for Small Business Owners",
    summary:
      "Three simple steps to start selling online in India: one shop link with your products and prices, orders on WhatsApp, and sharing your link everywhere your customers already are. Free to start.",
  },
  {
    to: "/guides/sell-on-whatsapp" as const,
    icon: MessageCircle,
    label: "WhatsApp selling",
    title: "How to sell on WhatsApp with a shop link",
    summary:
      "Set up your shop once, share one link, and let customers browse your products and prices before they message you — no more sending the same photos and price lists again and again.",
  },
  {
    to: "/guides/instagram-bio-shop-link-setup" as const,
    icon: Link2,
    label: "Instagram",
    title: "How to set up a shop link for your Instagram bio",
    summary:
      "A step-by-step setup: create your shop page, add products and prices, connect WhatsApp, and put the link in your bio — then check it works before you tell anyone about it.",
  },
  {
    to: "/guides/free-online-catalogue-india" as const,
    icon: LayoutGrid,
    label: "Catalogue",
    title: "How to create a free online catalogue for your small business in India",
    summary:
      "What a good catalogue contains, how to photograph products with a phone, and what “free” honestly includes — prices in rupees, UPI payments, and orders on WhatsApp.",
  },
];

function GuidesIndex() {
  return (
    <Section className="py-14 sm:py-20">
      {/* The page had no H1 — SectionHeading renders an H2. Same
          look, but a real H1 so the page has one top-level heading. */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Guides for selling online
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Practical, no-jargon help for small businesses, creators and local shops — written around
          how your customers already buy: through WhatsApp.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className="group rounded-xl border bg-card p-6 transition hover:border-primary/40"
          >
            <g.icon className="h-7 w-7 text-primary" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {g.label}
            </p>
            <h2 className="mt-1.5 text-xl font-bold leading-snug">{g.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{g.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">
              Read the guide{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
