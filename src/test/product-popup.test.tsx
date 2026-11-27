import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CataloguePhotos } from "@/components/CatalogueEditor";
import { buildProductData } from "@/components/ProductFormPopup";

describe("buildProductData", () => {
  it("trims fields and saves empty price/description as null", () => {
    const data = buildProductData({
      title: "  Chocolate Cake  ", price: " ", desc: "", images: [], category: "", optionLabel: "", options: [],
    });
    expect(data.title).toBe("Chocolate Cake");
    expect(data.price).toBeNull();
    expect(data.description).toBeNull();
    expect(data.category).toBeNull();
    expect(data.option_label).toBeNull();
    expect(data.options).toEqual([]);
  });

  it("drops buyer options when no option name is given", () => {
    const data = buildProductData({
      title: "Kurti", price: "₹999", desc: "", images: [], category: "Clothes", optionLabel: " ", options: ["S", "M"],
    });
    expect(data.option_label).toBeNull();
    expect(data.options).toEqual([]);
  });

  it("keeps sanitized options when an option name is given", () => {
    const data = buildProductData({
      title: "Kurti", price: "₹999", desc: "", images: ["/a.jpg"], category: "Clothes", optionLabel: "Size", options: ["S", "M", "S"],
    });
    expect(data.option_label).toBe("Size");
    expect(data.options).toEqual(["S", "M"]);
    expect(data.image_urls).toEqual(["/a.jpg"]);
  });
});

describe("photo uploader", () => {
  it("shows one big Add photos button when there are no photos", () => {
    render(<CataloguePhotos userId="u1" images={[]} onImages={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Add photos/ })).toBeInTheDocument();
    expect(screen.getByText(/Up to 4 photos/)).toBeInTheDocument();
  });

  it("shows the first photo as the cover with a remove button per photo", () => {
    const onImages = vi.fn();
    render(<CataloguePhotos userId="u1" images={["/cover.jpg", "/two.jpg"]} onImages={onImages} />);
    expect(screen.getByText("Cover photo")).toBeInTheDocument();
    expect(screen.getByText("Cover photo — shown first on your shop.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove photo 1" }));
    expect(onImages).toHaveBeenCalledWith(["/two.jpg"]);
  });
});
