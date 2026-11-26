import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogueCard } from "@/components/CatalogueCard";

const ITEM = {
  id: "1",
  title: "Cotton kurti",
  kind: "product",
  price: "₹999",
  description: "Soft cotton.",
  image_urls: ["/examples/kurti.webp"],
  category: "Clothes",
  option_label: "Size",
  options: ["S", "M", "L", "XL"],
};

function renderCard(item: typeof ITEM | (Omit<typeof ITEM, "option_label"> & { option_label: string | null }) = ITEM) {
  return render(
    <CatalogueCard
      item={item}
      whatsapp="919999999999"
      shopName="Thread Studio"
      pageUrl="https://izzytag.shop/threadstudio"
    />,
  );
}

describe("buyer option picker", () => {
  it("shows size chips in the product dialog and carries the choice into WhatsApp", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "View Cotton kurti" }));

    expect(screen.getByRole("group", { name: "Size" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    fireEvent.click(screen.getByRole("button", { name: "Order on WhatsApp" }));

    expect(screen.getByText("Complete your order")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Date needed"), { target: { value: "2026-12-12" } });

    const link = screen.getByRole("link", { name: "Send order on WhatsApp" });
    const message = decodeURIComponent(link.getAttribute("href")?.split("text=")[1] ?? "");
    expect(message).toContain("Size: L");
    expect(message).toContain('Product: "Cotton kurti"');
  });

  it("asks for the size before WhatsApp opens when none is picked", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "View Cotton kurti" }));
    fireEvent.click(screen.getByRole("button", { name: "Order on WhatsApp" }));

    expect(screen.getByText("Choose a size first.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send order on WhatsApp" })).toBeDisabled();
  });

  it("shows no picker for a product without options", () => {
    renderCard({ ...ITEM, option_label: null, options: [] });
    fireEvent.click(screen.getByRole("button", { name: "View Cotton kurti" }));

    expect(screen.queryByRole("group", { name: "Size" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Order on WhatsApp" }));
    expect(screen.getByText("Add the date you need it by.")).toBeInTheDocument();
  });
});
