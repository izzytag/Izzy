/**
 * Dashboard A Home — the ONE next step shown to the seller.
 * Pure logic so the two Home states (new seller / live shop) are
 * unit-tested without rendering the whole dashboard.
 */

export type HomeNextStep =
  | { kind: "add-first-product"; label: "Add your first product"; to: "/dashboard/products" }
  | { kind: "switch-on-first"; label: "Switch on your first product"; to: "/dashboard/products" }
  | { kind: "share-shop"; label: "Share your shop link" };

export function getHomeNextStep(input: { totalProducts: number; liveProducts: number }): HomeNextStep {
  if (input.liveProducts > 0) return { kind: "share-shop", label: "Share your shop link" };
  if (input.totalProducts > 0) return { kind: "switch-on-first", label: "Switch on your first product", to: "/dashboard/products" };
  return { kind: "add-first-product", label: "Add your first product", to: "/dashboard/products" };
}

/** Bottom navigation for Dashboard A: exactly four tabs. */
export const DASHBOARD_TABS = [
  { to: "/dashboard", label: "Home" },
  { to: "/dashboard/products", label: "Products" },
  { to: "/dashboard/store", label: "My Shop" },
  { to: "/dashboard/more", label: "More" },
] as const;

/** Plain list inside More. Plan price stays visible on the Plan row. */
export const MORE_ITEMS = [
  { to: "/dashboard/analytics", label: "Views & taps" },
  { to: "/dashboard/qr", label: "QR code" },
  { to: "/dashboard/upgrade", label: "Plan" },
  { to: "/dashboard/settings", label: "Settings" },
  { to: "/dashboard/support", label: "Help" },
] as const;
