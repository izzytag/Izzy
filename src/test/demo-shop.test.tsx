import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type AnyRoute,
} from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { DemoShopPage } from "@/routes/demo";
import { SHOWCASE } from "@/routes/index";
import { DEMO_GLOW_LAB, DEMO_PRIYA, DEMO_THREAD_STUDIO } from "@/lib/demo-shops";
import type { PublicData } from "@/components/PublicProfile";

// The demo page needs router context for its signup links, but the
// app's root route pulls in Supabase auth — so render it under a
// minimal test tree holding only the demo route and a stub /auth.
function renderDemoPage(shop: PublicData = DEMO_PRIYA, path = "/demo") {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const demoRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => <DemoShopPage shop={shop} />,
  });
  const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/auth",
    component: () => null,
  });
  const testTree = rootRoute.addChildren([demoRoute, authRoute]);
  const router = createRouter({
    routeTree: testTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Demo shop", () => {
  it("matches the /demo route, not the /$username shop page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/demo");

    // /demo is served by the demo.index child of the /demo layout route.
    expect(matches.at(-1)?.routeId).toBe("/demo/");
  });

  it("renders the demo banner and the example shop", async () => {
    renderDemoPage();

    expect(await screen.findByText("Demo shop")).toBeInTheDocument();
    expect(screen.getByText(/This is an example shop built with izzy/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cake Factory" })).toBeInTheDocument();
    expect(screen.getByText("Chocolate cake")).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
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
    expect(within(dialog).getByRole("link", { name: "Create your own shop" })).toHaveAttribute(
      "href",
      "/auth",
    );
  });
});

describe("Thread Studio demo shop", () => {
  it("matches the /demo/thread-studio route, not the /$username shop page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/demo/thread-studio");

    expect(matches.at(-1)?.routeId).toBe("/demo/thread-studio");
  });

  it("renders the demo banner and the Thread Studio shop", async () => {
    renderDemoPage(DEMO_THREAD_STUDIO, "/demo/thread-studio");

    expect(await screen.findByText("Demo shop")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Thread Studio" })).toBeInTheDocument();
    expect(screen.getByText("Canvas sling bag")).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
  });

  it("links the banner call to action to /auth", async () => {
    renderDemoPage(DEMO_THREAD_STUDIO, "/demo/thread-studio");

    const cta = await screen.findByRole("link", { name: "Create your own shop" });

    expect(cta).toHaveAttribute("href", "/auth");
  });

  it("contains no WhatsApp links anywhere on the page", async () => {
    const { container } = renderDemoPage(DEMO_THREAD_STUDIO, "/demo/thread-studio");
    await screen.findByText("Demo shop");

    expect(container.querySelectorAll('a[href*="wa.me"]')).toHaveLength(0);
    expect(container.querySelectorAll('a[href*="whatsapp"]')).toHaveLength(0);
  });
});

describe("Glow Lab demo shop", () => {
  it("matches the /demo/glow-lab route, not the /$username shop page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/demo/glow-lab");

    expect(matches.at(-1)?.routeId).toBe("/demo/glow-lab");
  });

  it("renders the demo banner and the Glow Lab shop", async () => {
    renderDemoPage(DEMO_GLOW_LAB, "/demo/glow-lab");

    expect(await screen.findByText("Demo shop")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Glow Lab" })).toBeInTheDocument();
    expect(screen.getByText("Soy candle")).toBeInTheDocument();
    expect(screen.getByText("₹299")).toBeInTheDocument();
  });

  it("links the banner call to action to /auth", async () => {
    renderDemoPage(DEMO_GLOW_LAB, "/demo/glow-lab");

    const cta = await screen.findByRole("link", { name: "Create your own shop" });

    expect(cta).toHaveAttribute("href", "/auth");
  });

  it("contains no WhatsApp links anywhere on the page", async () => {
    const { container } = renderDemoPage(DEMO_GLOW_LAB, "/demo/glow-lab");
    await screen.findByText("Demo shop");

    expect(container.querySelectorAll('a[href*="wa.me"]')).toHaveLength(0);
    expect(container.querySelectorAll('a[href*="whatsapp"]')).toHaveLength(0);
  });
});

describe("Homepage showcase demo links", () => {
  it("sends each showcase card to its own demo store", () => {
    const byName = new Map(SHOWCASE.map((s) => [s.data.display_name, s.demoPath]));

    expect(byName.get("Thread Studio")).toBe("/demo/thread-studio");
    expect(byName.get("Cake Factory")).toBe("/demo");
    expect(byName.get("Glow Lab")).toBe("/demo/glow-lab");
  });
});

// Regression tests for the demo-route nesting bug: /demo is the parent
// route of /demo/thread-studio and /demo/glow-lab, so if its component
// renders a shop instead of an <Outlet/>, the child shops never mount
// and both URLs show Cake Factory. These tests render the real demo
// branch — taken from the generated route tree — under a minimal test
// root, instead of rendering DemoShopPage with a shop prop directly.
function findRouteById(node: AnyRoute, id: string): AnyRoute | undefined {
  if (node.id === id) return node;
  for (const child of (node.children ?? []) as AnyRoute[]) {
    const found = findRouteById(child, id);
    if (found) return found;
  }
  return undefined;
}

function renderRealDemoBranch(path: string) {
  const demoBranch = findRouteById(routeTree, "/demo");
  if (!demoBranch) throw new Error("demo branch not found in route tree");
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/auth",
    component: () => null,
  });
  const testTree = rootRoute.addChildren([demoBranch, authRoute]);
  const router = createRouter({
    routeTree: testTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Demo route branch (real route tree)", () => {
  it("renders Thread Studio's shop at /demo/thread-studio, not Cake Factory's", async () => {
    renderRealDemoBranch("/demo/thread-studio");

    expect(await screen.findByRole("heading", { name: "Thread Studio" })).toBeInTheDocument();
    expect(screen.getByText("Canvas sling bag")).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.queryByText("Chocolate cake")).not.toBeInTheDocument();
  });

  it("renders Glow Lab's shop at /demo/glow-lab, not Cake Factory's", async () => {
    renderRealDemoBranch("/demo/glow-lab");

    expect(await screen.findByRole("heading", { name: "Glow Lab" })).toBeInTheDocument();
    expect(screen.getByText("Face serum (50 ml)")).toBeInTheDocument();
    expect(screen.getByText("₹899")).toBeInTheDocument();
    expect(screen.queryByText("Chocolate cake")).not.toBeInTheDocument();
  });

  it("still renders Cake Factory at /demo", async () => {
    renderRealDemoBranch("/demo");

    expect(await screen.findByRole("heading", { name: "Cake Factory" })).toBeInTheDocument();
    expect(screen.getByText("Chocolate cake")).toBeInTheDocument();
  });
});
