/**
 * Store product layout, saved per store on profiles.shop_layout.
 * - "grid": side by side — products in a grid, next to each other.
 * - "scroll": scrollable — products in a single vertical list.
 *
 * Anything missing or unknown falls back to "grid", so a page never
 * breaks on a bad value. This is the side-by-side look stores had
 * before the layout choice existed.
 */
export type ShopLayout = "grid" | "scroll";

export function normalizeShopLayout(value: unknown): ShopLayout {
  return value === "scroll" ? "scroll" : "grid";
}
