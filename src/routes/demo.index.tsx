import { createFileRoute } from "@tanstack/react-router";
import { DemoShopPage } from "@/routes/demo";

// Priya's Kitchen, the default demo shop at /demo. The parent
// /demo route is a layout that only renders an <Outlet/>, so this
// index child is what actually serves /demo.
export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Demo shop — izzy" },
      {
        name: "description",
        content:
          "Try an example izzy shop: browse the catalogue, open a product, and see how ordering on WhatsApp works.",
      },
      // An example shop is not a real business — keep it out of search results.
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoShopPage,
});
