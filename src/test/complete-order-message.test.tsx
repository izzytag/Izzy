import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogueCard } from "@/components/CatalogueCard";

const ITEM = { id: "1", title: "Chocolate cake", kind: "product", price: "₹499", description: "Rich Belgian chocolate.", image_urls: ["/examples/chocolate-cake.webp"], category: null };

function renderCard(props: Partial<React.ComponentProps<typeof CatalogueCard>> = {}) {
  return render(
    <CatalogueCard
      item={ITEM}
      whatsapp="919999999999"
      shopName="Cake Factory"
      pageUrl="https://izzytag.shop/cakefactory"
      {...props}
    />,
  );
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "View Chocolate cake" }));
}

function openOrderForm() {
  openDialog();
  fireEvent.click(screen.getByRole("button", { name: "Order on WhatsApp" }));
}

function orderMessage() {
  const link = screen.getByRole("link", { name: "Send order on WhatsApp" });
  return decodeURIComponent(link.getAttribute("href")?.split("text=")[1] ?? "");
}

describe("Complete order message", () => {
  it("shows the order form before WhatsApp opens", () => {
    renderCard();
    openOrderForm();

    expect(screen.getByText("Complete your order")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Quantity" })).toHaveTextContent("1");
    expect(screen.getByLabelText("Date needed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pickup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delivery" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Note for the seller/)).toBeInTheDocument();
    // Address only applies to delivery, so it starts hidden.
    expect(screen.queryByLabelText("Delivery address")).not.toBeInTheDocument();
    // The send action is disabled until the date is added.
    expect(screen.getByRole("button", { name: "Send order on WhatsApp" })).toBeDisabled();
    expect(screen.getByText("Add the date you need it by.")).toBeInTheDocument();
  });

  it("sends a complete pickup order once the date is added", () => {
    renderCard();
    openOrderForm();

    fireEvent.change(screen.getByLabelText("Date needed"), { target: { value: "2026-12-12" } });
    fireEvent.change(screen.getByLabelText(/Note for the seller/), { target: { value: "Happy birthday on the cake" } });

    const message = orderMessage();
    expect(message).toContain('Product: "Chocolate cake"');
    expect(message).toContain("Quantity: 1");
    expect(message).toContain("Total: ₹499");
    expect(message).toContain("Date needed: 12 Dec 2026");
    expect(message).toContain("Pickup or delivery: Pickup");
    expect(message).toContain("Note: Happy birthday on the cake");
    expect(message).not.toContain("Delivery address");
    expect(message).not.toContain("tell me more");
  });

  it("asks for the address on delivery and multiplies the total", () => {
    renderCard();
    openOrderForm();

    fireEvent.click(screen.getByRole("button", { name: "Delivery" }));
    expect(screen.getByLabelText("Delivery address")).toBeInTheDocument();
    expect(screen.getByText("Add the date you need it by.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Date needed"), { target: { value: "2026-12-12" } });
    expect(screen.getByText("Add the delivery address.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "12 Rose Lane, Mumbai" } });
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByText(/Total: ₹998/)).toBeInTheDocument();

    const message = orderMessage();
    expect(message).toContain("Quantity: 2");
    expect(message).toContain("Total: ₹998");
    expect(message).toContain("Pickup or delivery: Delivery");
    expect(message).toContain("Delivery address: 12 Rose Lane, Mumbai");
  });

  it("returns to the product details from Back", () => {
    renderCard();
    openOrderForm();

    fireEvent.click(screen.getByRole("button", { name: "Back to product" }));

    expect(screen.queryByText("Complete your order")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Order on WhatsApp" })).toBeInTheDocument();
  });

  it("never shows the form on the demo shop", () => {
    renderCard({ demoMode: true, whatsapp: null });
    openDialog();

    expect(screen.getByRole("link", { name: "Create your own shop" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Order on WhatsApp" })).not.toBeInTheDocument();
    expect(screen.queryByText("Complete your order")).not.toBeInTheDocument();
  });
});
