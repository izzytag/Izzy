import fs from "node:fs";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  Outlet,
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OverviewPage } from "@/routes/_authenticated/dashboard.index";
import { ReferralCard } from "@/components/ReferralCard";

// The referral counts come from a server function; in this test the
// stats resolve immediately so the plain counts line renders.
vi.mock("@/lib/referral.functions", () => ({
  referralStats: () =>
    Promise.resolve({ available: true, signups: 2, active: 1, freeMonthsEarned: 1 }),
}));

const UID = "user-1";

const ACCOUNT = {
  user: { id: UID, email: "seller@example.com" },
  profile: {
    id: UID,
    display_name: "Test Shop",
    username: "testshop",
    bio: "A shop for testing.",
    category: "Bakery",
    avatar_url: null,
    whatsapp: "919999999999",
    theme: "light",
    socials: {},
    upi_id: null,
    suspended: false,
  },
  isPro: false,
  sub: null,
};

const LINKS = [
  {
    id: "link-1",
    user_id: UID,
    title: "Chocolate cake",
    url: "",
    enabled: true,
    position: 0,
    created_at: new Date().toISOString(),
    kind: "product",
    price: "₹499",
    description: "Rich Belgian chocolate.",
    image_urls: [],
    category: null,
  },
  {
    id: "link-2",
    user_id: UID,
    title: "Sourdough loaf",
    url: "",
    enabled: false,
    position: 1,
    created_at: new Date().toISOString(),
    kind: "product",
    price: "₹199",
    description: null,
    image_urls: [],
    category: null,
  },
];

const STATS = { views: [], productViews: [], whatsappClicks: [], totalViews: 0 };

function renderOverview() {
  const qc = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  qc.setQueryData(["account"], ACCOUNT);
  qc.setQueryData(["links", UID], LINKS);
  qc.setQueryData(["stats", UID, 7], STATS);

  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  // The file route carries the app's generated parent chain, so the
  // page is mounted under a plain test route instead (same pattern as
  // mobile-shop.test.tsx). Data is prefilled and fresh, so the page's
  // suspense queries never fetch.
  const overviewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard/",
    component: OverviewPage,
  });
  const routeTree = rootRoute.addChildren([overviewRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/dashboard/"] }),
    context: { queryClient: qc },
  });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Muji-minimal dashboard", () => {
  it("renders the Overview greeting, shop status and next step", async () => {
    renderOverview();

    expect(await screen.findByRole("heading", { name: /Good (morning|afternoon|evening), Test Shop/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Test Shop" })).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Your next step")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quick actions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Shop performance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "More" })).toBeInTheDocument();
  });

  it("keeps the referral card functional but plain, under More", async () => {
    renderOverview();

    expect(await screen.findByText("Invite sellers, earn free Pro")).toBeInTheDocument();
    expect(await screen.findByText(/signed up/)).toBeInTheDocument();
    // Three Copy link buttons render: shop link, next step, referral link.
    expect(screen.getAllByRole("button", { name: /Copy link/ })).toHaveLength(3);
    // Three Share buttons render: shop link, next step, referral link.
    expect(screen.getAllByRole("button", { name: "Share" })).toHaveLength(3);
  });

  it("has no violet card chrome left on the Overview", async () => {
    const { container } = renderOverview();
    await screen.findByRole("heading", { name: /Good (morning|afternoon|evening), Test Shop/ });

    expect(container.querySelector('[class*="bg-primary-soft"]')).toBeNull();
    expect(container.querySelector('[class*="border-primary/30"]')).toBeNull();
    // The single primary action button (bg-primary) is the one
    // restrained accent the design allows, so it is not asserted away.
  });

  it("renders the ReferralCard counts as one plain line", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <ReferralCard username="testshop" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Invite sellers, earn free Pro")).toBeInTheDocument();
    expect(await screen.findByText(/signed up/)).toBeInTheDocument();
    expect(await screen.findByText(/free months earned/)).toBeInTheDocument();
  });

  it("scopes the minimal palette to the dashboard via .muji tokens", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/styles.css"), "utf8");
    const muji = css.match(/\.muji \{[^}]*\}/s);

    expect(muji).not.toBeNull();
    expect(muji![0]).toContain("--primary: #1c1c1c");
    expect(muji![0]).toContain("--background: #FAF9F6");
    expect(muji![0]).toContain("--radius: 0.375rem");
    // The public violet accent still exists outside the scope.
    expect(css).toContain("--primary: #7457E8");
  });
});
