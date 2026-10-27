import { describe, expect, it } from "vitest";
import { normalizeShopLayout } from "./shop-layout";

describe("normalizeShopLayout", () => {
  it("keeps grid and scroll as-is", () => {
    expect(normalizeShopLayout("grid")).toBe("grid");
    expect(normalizeShopLayout("scroll")).toBe("scroll");
  });

  it("falls back to grid for missing or unknown values", () => {
    expect(normalizeShopLayout(null)).toBe("grid");
    expect(normalizeShopLayout(undefined)).toBe("grid");
    expect(normalizeShopLayout("")).toBe("grid");
    expect(normalizeShopLayout("masonry")).toBe("grid");
    expect(normalizeShopLayout("SCROLL")).toBe("grid");
  });
});
