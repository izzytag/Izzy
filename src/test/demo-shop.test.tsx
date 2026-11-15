import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { DemoShopPage } from "@/routes/demo";

// The demo page needs router context for its signup links, but the
// app's root route pulls in Supabase auth — so render it under a
// minimal test tree holding only /demo and a stub /auth.
function renderDemoPage() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const demoRoute = createRoute({ getParentRoute: () => rootRoute, path: "/demo", component: DemoShopPage });
  const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: () => null });
  const testTree = rootRoute.addChildren([demoRoute, authRoute]);
  const router = createRouter({ routeTree: testTree, history: createMemoryHistory({ initialEntries: ["/demo"] }) });
  return render(<RouterProvider router={router} />);
}

describe("Demo shop", () => {
  it("matches the /demo route, not the /$username shop page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/demo");

    expect(matches.at(-1)?.routeId).toBe("/demo");
  });

  it("renders the demo banner and the example shop", async () => {
    renderDemoPage();

    expect(await screen.findByText("Demo shop")).toBeInTheDocument();
    expect(screen.getByText(/This is an example shop built with izzy/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Priya's Kitchen" })).toBeInTheDocument();
    expect(screen.getByText("Chocolate cake")).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.getByText("Celebration cake consultation")).toBeInTheDocument();
  });

  it("links the banner call to action to /auth", async () => {
    renderDemoPage();

    const cta = await screen.findByRole("link", { name: "Create your own shop" });

    expect(cta).toHaveAttribute("href", "/auth");
  });

  it("contains no WhatsApp links anywhere on the page", async () => {
    const { container } = renderDemoPage();
    await screen.findByText("Demo shop");

    expect(container.querySelectorAll('a[href*="wa.me"]')).toHaveLength(0);
    expect(container.querySelectorAll('a[href*="whatsapp"]')).toHaveLength(0);
  });

  it("shows a signup call to action, not a WhatsApp order button, in the product dialog", async () => {
    renderDemoPage();
    await screen.findByText("Demo shop");

    fireEvent.click(screen.getByRole("button", { name: "View Chocolate cake" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/Order on WhatsApp/)).not.toBeInTheDocument();
    expect(within(dialog).getByText(/This is a demo shop/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Create your own shop" })).toHaveAttribute("href", "/auth");
  });

  it("shows the same signup call to action for a service", async () => {
    renderDemoPage();
    await screen.findByText("Demo shop");

    fireEvent.click(screen.getByRole("button", { name: "View Celebration cake consultation" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/Book on WhatsApp/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Create your own shop" })).toHaveAttribute("href", "/auth");
  });
});
