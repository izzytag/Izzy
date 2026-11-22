import { createFileRoute } from "@tanstack/react-router";
import { DemoShopPage } from "@/routes/demo";
import { DEMO_THREAD_STUDIO } from "@/lib/demo-shops";

export const Route = createFileRoute("/demo/thread-studio")({
  head: () => ({
    meta: [
      { title: "Thread Studio — Demo shop — izzy" },
      {
        name: "description",
        content:
          "Try an example izzy shop: browse Thread Studio's catalogue, open a product, and see how ordering on WhatsApp works.",
      },
      // An example shop is not a real business — keep it out of search results.
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadStudioDemoPage,
});

export function ThreadStudioDemoPage() {
  return <DemoShopPage shop={DEMO_THREAD_STUDIO} />;
}
