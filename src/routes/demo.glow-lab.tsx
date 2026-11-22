import { createFileRoute } from "@tanstack/react-router";
import { DemoShopPage } from "@/routes/demo";
import { DEMO_GLOW_LAB } from "@/lib/demo-shops";

export const Route = createFileRoute("/demo/glow-lab")({
  head: () => ({
    meta: [
      { title: "Glow Lab — Demo shop — izzy" },
      {
        name: "description",
        content:
          "Try an example izzy shop: browse Glow Lab's catalogue, open a product, and see how ordering on WhatsApp works.",
      },
      // An example shop is not a real business — keep it out of search results.
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GlowLabDemoPage,
});

export function GlowLabDemoPage() {
  return <DemoShopPage shop={DEMO_GLOW_LAB} />;
}
