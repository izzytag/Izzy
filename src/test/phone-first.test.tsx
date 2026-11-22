import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { accountQuery } from "@/lib/account";
import { CatalogueCard } from "@/components/CatalogueCard";
import { DashboardLinkItem, type LinkRow } from "@/components/DashboardLinkItem";
import { OnboardingPage } from "@/routes/_authenticated/onboarding";

// Supabase is a network client — in tests every call resolves
// successfully so the flow can advance without a backend.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        createSignedUrl: () => Promise.resolve({ data: null }),
      }),
    },
    auth: { signOut: () => Promise.resolve({}) },
  },
}));

const ITEM = { id: "1", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate.", image_urls: ["/examples/chocolate-cake.webp"], category: null };

async function renderOnboarding() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(accountQuery.queryKey, {
    user: { id: "user-1" },
    profile: {
      id: "user-1",
      display_name: null,
      bio: null,
      category: null,
      whatsapp: null,
      username: null,
      avatar_url: null,
    },
    isPro: false,
    sub: null,
  } as never);
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={qc}>
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const obRoute = createRoute({ getParentRoute: () => rootRoute, path: "/onboarding", component: OnboardingPage });
  const router = createRouter({ routeTree: rootRoute.addChildren([obRoute]), history: createMemoryHistory({ initialEntries: ["/onboarding"] }) });
  // The router matches and loads its routes asynchronously — wait
  // for it before rendering, or the page is an empty div.
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("Phone-first onboarding", () => {
  it("asks one question per screen, starting with the business name", async () => {
    const { container } = await renderOnboarding();

    expect(screen.getByRole("heading", { name: "What's your business called?" })).toBeInTheDocument();
    expect(screen.queryByText("What do you sell?")).toBeNull();
    expect(screen.queryByText("About your business")).toBeNull();
    expect(screen.getByText("Step 1 of 6 — Business")).toBeInTheDocument();

    const progress = container.querySelector('[data-testid="onboarding-progress"]');
    const segments = progress?.querySelectorAll("span") ?? [];
    expect(segments).toHaveLength(6);
    expect(segments[0]?.classList.contains("bg-primary")).toBe(true);
    expect(segments[1]?.classList.contains("bg-muted")).toBe(true);
  });

  it("walks name → tap-to-pick category → description → WhatsApp, with the example collapsed", async () => {
    await renderOnboarding();

    fireEvent.change(screen.getByLabelText("Business name"), { target: { value: "Priya's Kitchen" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("What do you sell?")).toBeInTheDocument();
    const group = screen.getByRole("group", { name: "Business category" });
    expect(within(group).getAllByRole("button")).toHaveLength(8);
    expect(screen.getByText("Step 2 of 6 — Business")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Food & Bakery" }));
    expect(await screen.findByText("Tell customers about your business")).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 6 — Business")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Where should your customers contact you?")).toBeInTheDocument();
    expect(screen.getByText("Step 4 of 6 — WhatsApp")).toBeInTheDocument();

    // The example sits behind a tap so the Continue button is
    // visible without scrolling on a phone.
    const details = document.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    const summary = screen.getByText("See what your customer sees");
    expect(summary.tagName).toBe("SUMMARY");
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
  });
});

describe("Phone-first product bottom sheet", () => {
  it("opens product details as a bottom sheet on phones and a centered dialog on wider screens", () => {
    render(<CatalogueCard item={ITEM} whatsapp="919999999999" shopName="Test Shop" pageUrl="/testshop" />);

    fireEvent.click(screen.getByRole("button", { name: "View Chocolate cake" }));
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    // Bottom sheet on phones: docked to the bottom edge, full width.
    expect(dialog?.classList.contains("inset-x-0")).toBe(true);
    expect(dialog?.classList.contains("bottom-0")).toBe(true);
    expect(dialog?.classList.contains("max-sm:data-[state=open]:slide-in-from-bottom")).toBe(true);
    // Centered dialog on wider screens.
    expect(dialog?.classList.contains("sm:left-[50%]")).toBe(true);
    expect(dialog?.classList.contains("sm:top-[50%]")).toBe(true);
    // Grabber bar at the top of the sheet.
    expect(dialog?.querySelector('[aria-hidden="true"].mx-auto')).not.toBeNull();
    // The Order button is still pinned at the bottom of the sheet.
    const order = screen.getByRole("link", { name: /Order on WhatsApp/ });
    expect(order.closest("div.sticky")?.classList.contains("bottom-0")).toBe(true);
  });
});

describe("Phone-first dashboard tap targets", () => {
  it("gives the product row controls a 44px hit area", () => {
    const row = {
      id: "row-1",
      user_id: "user-1",
      title: "Chocolate cake",
      url: "",
      kind: "product",
      price: "₹499",
      description: "Rich Belgian chocolate.",
      image_urls: [],
      category: null,
      enabled: false,
      position: 0,
      created_at: "2026-01-01T00:00:00.000Z",
    } as unknown as LinkRow;

    render(
      <DndContext onDragEnd={() => {}}>
        <DashboardLinkItem link={row} onUpdate={() => {}} onDelete={() => {}} userId="user-1" />
      </DndContext>,
    );

    const drag = screen.getByRole("button", { name: "Drag to reorder" });
    expect(drag.classList.contains("min-h-[44px]")).toBe(true);
    expect(drag.classList.contains("min-w-[44px]")).toBe(true);

    const remove = screen.getByRole("button", { name: "Delete product" });
    expect(remove.classList.contains("min-h-[44px]")).toBe(true);
    expect(remove.classList.contains("min-w-[44px]")).toBe(true);

    const toggle = screen.getByRole("switch", { name: "Show product" });
    expect(toggle.parentElement?.classList.contains("min-h-[44px]")).toBe(true);
    expect(toggle.parentElement?.classList.contains("min-w-[44px]")).toBe(true);
  });
});
