import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicProfile, type PublicData } from "@/components/PublicProfile";
import { isCatalogueProduct } from "@/lib/catalogue";
import { DEMO_SHOP } from "@/routes/demo";

// Izzy sells products only. Service rows stay in the database but are
// never shown, counted, or creatable. The storefront, the dashboard
// products list, and analytics all filter through isCatalogueProduct,
// so the helper test below covers the dashboard list too (rendering
// the full dashboard page needs a server the test run lacks).
describe("products only — no services", () => {
  it("treats only product-kind rows as catalogue items", () => {
    expect(isCatalogueProduct({ kind: "product" })).toBe(true);
    expect(isCatalogueProduct({ kind: "service" })).toBe(false);
    expect(isCatalogueProduct({ kind: "link" })).toBe(false);
    expect(isCatalogueProduct({})).toBe(false);
    expect(isCatalogueProduct({ kind: null })).toBe(false);
  });

  it("hides a service-kind row from the public shop page", () => {
    const shop: PublicData = {
      display_name: "Test Shop",
      username: "testshop",
      bio: "A shop for testing.",
      avatar_url: null,
      socials: {},
      whatsapp: "919999999999",
      upi_id: null,
      links: [
        { id: "1", title: "Chocolate cake", url: "#", kind: "product", price: "₹499", description: "Rich Belgian chocolate.", image_urls: [], category: null },
        { id: "2", title: "Cake consultation", url: "#", kind: "service", price: "₹999", description: "A one-to-one session.", image_urls: [], category: null },
      ],
    };
    render(<PublicProfile data={shop} theme="light" showBranding />);

    expect(screen.getByText("Chocolate cake")).toBeInTheDocument();
    expect(screen.queryByText("Cake consultation")).not.toBeInTheDocument();
    expect(screen.queryByText(/Book on WhatsApp/)).not.toBeInTheDocument();
  });

  it("keeps the demo shop products-only", () => {
    expect(DEMO_SHOP.links).toHaveLength(4);
    expect(DEMO_SHOP.links.every((l) => l.kind === "product")).toBe(true);
  });
});
