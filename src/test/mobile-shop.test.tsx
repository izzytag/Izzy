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

import { CatalogueCard } from "@/components/CatalogueCard";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { PhonePreview } from "@/components/PhonePreview";
import { PublicProfile, type PublicData } from "@/components/PublicProfile";
import { ReportShopButton } from "@/components/ReportShopButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

const ITEM = { id: "1", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate.", image_urls: ["/examples/chocolate-cake.webp"], category: null };

const SHOP: PublicData = {
  display_name: "Test Shop",
  username: "testshop",
  bio: "A shop for testing.",
  category: "Bakery",
  avatar_url: "/examples/chocolate-cake.webp",
  socials: { instagram: "testshop" },
  whatsapp: "919999999999",
  upi_id: null,
  links: [ITEM],
};

describe("Mobile shop fixes", () => {
  it("gives the dialog close button a 44px tap target", () => {
    render(
      <Dialog open>
        <DialogContent>
          <p>Dialog body</p>
        </DialogContent>
      </Dialog>,
    );

    const close = screen.getByRole("button", { name: "Close" });

    expect(close.classList.contains("h-11")).toBe(true);
    expect(close.classList.contains("w-11")).toBe(true);
  });

  it("keeps the demo banner non-sticky on phones and full-widths its call to action", async () => {
    renderDemoPage();

    const pill = await screen.findByText("Demo shop");
    const banner = pill.parentElement?.parentElement;
    const cta = screen.getByRole("link", { name: "Create your own shop" });

    expect(banner?.classList.contains("sm:sticky")).toBe(true);
    expect(banner?.classList.contains("sticky")).toBe(false);
    expect(cta.classList.contains("w-full")).toBe(true);
    expect(cta.classList.contains("sm:w-auto")).toBe(true);
  });

  it("centers the shop header on phones with a labeled share row", () => {
    const { container } = render(<PublicProfile data={SHOP} theme="light" showBranding />);

    const heading = screen.getByRole("heading", { name: "Test Shop" });
    const header = heading.parentElement?.parentElement;
    const cornerButton = container.querySelector("button[aria-label='Share this shop']");

    expect(header?.classList.contains("flex-col")).toBe(true);
    expect(header?.classList.contains("sm:flex-row")).toBe(true);
    expect(screen.getByText("Share this shop")).toBeInTheDocument();
    // The corner icon button exists only for wider screens.
    expect(cornerButton?.classList.contains("hidden")).toBe(true);
    expect(cornerButton?.classList.contains("sm:flex")).toBe(true);
  });

  it("always centers the header in compact mode, with no corner share button", () => {
    const { container } = render(<PublicProfile data={SHOP} theme="light" showBranding compact />);

    const heading = screen.getByRole("heading", { name: "Test Shop" });
    const header = heading.parentElement?.parentElement;

    expect(header?.classList.contains("flex-col")).toBe(true);
    expect(header?.classList.contains("items-center")).toBe(true);
    expect(header?.classList.contains("sm:flex-row")).toBe(false);
    expect(screen.getByText("Share this shop")).toBeInTheDocument();
    expect(container.querySelector("button[aria-label='Share this shop']")).toBeNull();
  });

  it("reserves space for pin images and drops the See details line", () => {
    const { container } = render(
      <CatalogueCard item={ITEM} whatsapp={null} pageUrl="/testshop" />,
    );

    const img = container.querySelector("img");

    expect(img?.parentElement?.classList.contains("min-h-[120px]")).toBe(true);
    expect(screen.queryByText(/See details/)).toBeNull();
  });

  it("pins the product dialog actions to the bottom of the dialog", () => {
    render(<CatalogueCard item={ITEM} whatsapp={SHOP.whatsapp} shopName="Test Shop" pageUrl="/testshop" />);

    fireEvent.click(screen.getByRole("button", { name: "View Chocolate cake" }));
    const order = screen.getByRole("link", { name: /Order on WhatsApp/ });
    const actionBlock = order.closest("div.sticky");

    expect(actionBlock?.classList.contains("bottom-0")).toBe(true);
    expect(within(actionBlock as HTMLElement).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("labels the floating WhatsApp button while keeping its size and colour", () => {
    const { container } = render(<FloatingWhatsAppButton whatsapp="919999999999" floating="fixed" />);

    const button = screen.getByRole("link", { name: "Chat on WhatsApp" });

    expect(button).toHaveTextContent("Chat on WhatsApp");
    expect(button.classList.contains("h-14")).toBe(true);
    expect(button.classList.contains("w-14")).toBe(false);
    expect(button.classList.contains("z-40")).toBe(true);
    expect(container.firstChild).toHaveStyle({ backgroundColor: "#25D366" });
  });

  it("renders no floating button without a WhatsApp number", () => {
    const { container } = render(<FloatingWhatsAppButton whatsapp={null} floating="fixed" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders no WhatsApp button inside the phone preview", () => {
    const { container } = render(<PhonePreview data={SHOP} theme="light" showBranding />);

    expect(screen.getByRole("heading", { name: "Test Shop" })).toBeInTheDocument();
    expect(container.querySelectorAll('a[href*="wa.me"]')).toHaveLength(0);
  });

  it("keeps the report dialog inside the viewport with rounded corners", () => {
    render(<ReportShopButton username="testshop" />);

    fireEvent.click(screen.getByRole("button", { name: "Report this shop" }));
    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog?.classList.contains("max-w-[calc(100vw-2rem)]")).toBe(true);
    expect(dialog?.classList.contains("rounded-2xl")).toBe(true);
  });
});
