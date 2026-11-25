import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type RouteComponent,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The pages read the visitor pricing region, which calls a server
// function — pin it to ROW so the render stays offline and
// deterministic.
vi.mock("@/lib/useRegion", () => ({ useRegion: () => "ROW" as const }));

import { GUIDES } from "@/routes/guides.index";
import { Landing } from "@/routes/index";
import { Pricing } from "@/routes/pricing";

// The pages use <Link to="/auth">, so render them under a minimal
// test tree holding only the page and a stub /auth — the app's root
// route pulls in Supabase auth and is deliberately not mounted.
// The router resolves its initial match asynchronously, so load it
// before rendering — otherwise the page is still empty when the
// assertions run.
async function renderPage(path: string, component: RouteComponent) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const pageRoute = createRoute({ getParentRoute: () => rootRoute, path, component });
  const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: () => null });
  const testTree = rootRoute.addChildren([pageRoute, authRoute]);
  const router = createRouter({ routeTree: testTree, history: createMemoryHistory({ initialEntries: [path] }) });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("slimmed homepage", () => {
  it("no longer renders the removed FAQ questions, and keeps the other four", async () => {
    await renderPage("/", Landing);

    expect(screen.queryByText("Can customers order through WhatsApp?")).toBeNull();
    expect(screen.queryByText("Can I share my shop on Instagram?")).toBeNull();
    expect(screen.queryByText("Do I need technical knowledge?")).toBeNull();
    expect(screen.getByText("What is izzy?")).toBeInTheDocument();
    expect(screen.getByText("How do I create my online shop?")).toBeInTheDocument();
    expect(screen.getByText("Does izzy process payments?")).toBeInTheDocument();
    expect(screen.getByText("Can I edit my products later?")).toBeInTheDocument();
  });

  it("no longer renders the Basic analytics feature block or the trust strip", async () => {
    await renderPage("/", Landing);

    expect(screen.queryByText("Basic analytics")).toBeNull();
    expect(screen.queryByText("Simple setup")).toBeNull();
    expect(screen.queryByText("Your own shop link")).toBeNull();
    expect(screen.queryByText("Orders through WhatsApp")).toBeNull();
    // The merged link + QR block and the catalog block remain.
    expect(screen.getByText("One link and a QR code")).toBeInTheDocument();
    expect(screen.getByText("Beautiful online catalog")).toBeInTheDocument();
  });

  it("keeps the WhatsApp conversation mockup but drops the numbered steps", async () => {
    await renderPage("/", Landing);

    expect(screen.getByText("You and your customer talk directly.")).toBeInTheDocument();
    expect(screen.queryByText("Customer discovers a product")).toBeNull();
    expect(screen.queryByText("WhatsApp opens, message ready")).toBeNull();
    expect(screen.queryByText("You take it from there")).toBeNull();
  });

  it("has no language switcher and a single footer tagline", async () => {
    await renderPage("/", Landing);

    expect(screen.queryByLabelText("Switch language")).toBeNull();
    expect(screen.getAllByText("Your business. Your products. One shop link.")).toHaveLength(1);
  });
});

describe("slimmed guides index", () => {
  it("lists exactly four guides", () => {
    expect(GUIDES).toHaveLength(4);
    expect(GUIDES.map((g) => g.to)).toEqual([
      "/guides/how-to-sell-online-in-india",
      "/guides/sell-on-whatsapp",
      "/guides/instagram-bio-shop-link-setup",
      "/guides/free-online-catalogue-india",
    ]);
  });
});

describe("slimmed pricing page", () => {
  it("reads the Pro price with a space before 'for Pro'", async () => {
    await renderPage("/pricing", Pricing);

    expect(screen.getByText("$1/month for Pro. No surprises.")).toBeInTheDocument();
  });

  it("renders the shared site footer", async () => {
    await renderPage("/pricing", Pricing);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Your business. Your products. One shop link.")).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Guides" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Terms" })).toBeInTheDocument();
  });
});
