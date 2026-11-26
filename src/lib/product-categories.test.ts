import { describe, expect, it } from "vitest";
import {
  PRODUCT_CATEGORIES,
  addOptionChoice,
  hasOptionFields,
  isMissingOptionColumnError,
  presetForCategory,
  removeOptionChoice,
  sanitizeOptionLabel,
  sanitizeOptions,
  withoutOptionFields,
} from "./product-categories";
import { DASHBOARD_TABS, MORE_ITEMS, getHomeNextStep } from "./dashboard-home";
import { waOrderLink } from "./themes";

describe("product category presets", () => {
  it("clothes get sizes, liquids get volume, food gets weight", () => {
    expect(presetForCategory("Clothes")).toEqual({ optionLabel: "Size", options: ["S", "M", "L", "XL", "XXL", "Free size"] });
    expect(presetForCategory("Drinks & liquids").optionLabel).toBe("Volume");
    expect(presetForCategory("Drinks & liquids").options).toContain("1 liter");
    expect(presetForCategory("Food & bakery").optionLabel).toBe("Weight");
    expect(presetForCategory("Footwear").options).toContain("UK 9");
  });

  it("no category and Other start with no preset option", () => {
    expect(presetForCategory("")).toEqual({ optionLabel: null, options: [] });
    expect(presetForCategory(null)).toEqual({ optionLabel: null, options: [] });
    expect(presetForCategory("Other")).toEqual({ optionLabel: null, options: [] });
    expect(presetForCategory("Something typed long ago")).toEqual({ optionLabel: null, options: [] });
  });

  it("every preset category is offered as a chip", () => {
    expect([...PRODUCT_CATEGORIES]).toContain("Clothes");
    expect([...PRODUCT_CATEGORIES]).toContain("Drinks & liquids");
    expect([...PRODUCT_CATEGORIES]).toContain("Other");
    expect(PRODUCT_CATEGORIES.length).toBe(9);
  });

  it("preset copies do not mutate the shared list", () => {
    const a = presetForCategory("Clothes");
    a.options.push("XXXL");
    expect(presetForCategory("Clothes").options).not.toContain("XXXL");
  });
});

describe("custom options", () => {
  it("seller can add their own choice and remove one", () => {
    expect(addOptionChoice(["S", "M"], "  XXL ")).toEqual(["S", "M", "XXL"]);
    expect(addOptionChoice(["S"], "s")).toEqual(["S"]);
    expect(addOptionChoice(["S"], "   ")).toEqual(["S"]);
    expect(removeOptionChoice(["S", "M", "L"], "M")).toEqual(["S", "L"]);
  });

  it("sanitizes labels and choices", () => {
    expect(sanitizeOptionLabel("  Size ")).toBe("Size");
    expect(sanitizeOptionLabel("   ")).toBeNull();
    expect(sanitizeOptions([" L ", "", "l", "M"])).toEqual(["L", "M"]);
    expect(sanitizeOptions(null)).toEqual([]);
  });
});

describe("missing option column fallback", () => {
  it("detects PostgREST missing-column errors for the option fields", () => {
    expect(isMissingOptionColumnError({ message: "Could not find the 'option_label' column of 'links' in the schema cache", code: "PGRST204" })).toBe(true);
    expect(isMissingOptionColumnError({ message: "column links.options does not exist", code: "42703" })).toBe(true);
    expect(isMissingOptionColumnError({ message: "duplicate key value violates unique constraint" })).toBe(false);
    expect(isMissingOptionColumnError({ message: "Could not find the 'title' column in the schema cache", code: "PGRST204" })).toBe(false);
    expect(isMissingOptionColumnError(null)).toBe(false);
  });

  it("strips only the option fields for the retry save", () => {
    const patch = { title: "Kurti", price: "₹999", option_label: "Size", options: ["L"] };
    expect(hasOptionFields(patch)).toBe(true);
    expect(withoutOptionFields(patch)).toEqual({ title: "Kurti", price: "₹999" });
    expect(hasOptionFields({ title: "Kurti" })).toBe(false);
  });
});

describe("WhatsApp order message with a chosen option", () => {
  const base = { quantity: 1, dateNeeded: "2026-12-12", fulfilment: "pickup" as const };

  it("carries the chosen option as one line", () => {
    const u = waOrderLink("98765 43210", "Kurti", "https://izzytag.shop/shop", { ...base, optionLabel: "Size", option: "L" }, { price: "₹999", shopName: "Shop" });
    const m = decodeURIComponent(u.split("text=")[1] ?? "");
    expect(m).toContain("Size: L");
    expect(m).toContain('Product: "Kurti"');
  });

  it("omits the option line when none is chosen", () => {
    const u = waOrderLink("98765 43210", "Kurti", "https://izzytag.shop/shop", base, { price: "₹999", shopName: "Shop" });
    const m = decodeURIComponent(u.split("text=")[1] ?? "");
    expect(m).not.toContain("Size:");
    expect(m).not.toContain("Option:");
  });
});

describe("dashboard A navigation and Home states", () => {
  it("has exactly four tabs in order", () => {
    expect(DASHBOARD_TABS.map((t) => t.label)).toEqual(["Home", "Products", "My Shop", "More"]);
    expect(DASHBOARD_TABS.map((t) => t.to)).toEqual(["/dashboard", "/dashboard/products", "/dashboard/store", "/dashboard/more"]);
  });

  it("More lists views, QR, plan, settings and help on existing routes", () => {
    expect(MORE_ITEMS.map((i) => i.label)).toEqual(["Views & taps", "QR code", "Plan", "Settings", "Help"]);
    expect(MORE_ITEMS.map((i) => i.to)).toContain("/dashboard/analytics");
    expect(MORE_ITEMS.map((i) => i.to)).toContain("/dashboard/upgrade");
  });

  it("new seller sees Add your first product, live shop sees Share", () => {
    expect(getHomeNextStep({ totalProducts: 0, liveProducts: 0 }).kind).toBe("add-first-product");
    expect(getHomeNextStep({ totalProducts: 2, liveProducts: 0 }).kind).toBe("switch-on-first");
    expect(getHomeNextStep({ totalProducts: 3, liveProducts: 1 }).kind).toBe("share-shop");
  });
});
