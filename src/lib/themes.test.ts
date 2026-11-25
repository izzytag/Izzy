import { describe, it, expect } from "vitest";
import { canAddLink, effectiveTheme, validateUsername, waLink } from "./themes";

describe("plan rules", () => {
  it("free plan allows up to 5 links", () => {
    expect(canAddLink(4, false)).toBe(true);
    expect(canAddLink(5, false)).toBe(false);
  });
  it("pro plan has unlimited links", () => {
    expect(canAddLink(500, true)).toBe(true);
  });
  it("preset themes are pro-only", () => {
    expect(effectiveTheme("marigold", false)).toBe("light");
    expect(effectiveTheme("marigold", true)).toBe("marigold");
    expect(effectiveTheme("dark", false)).toBe("dark");
  });
  it("rejects reserved usernames", () => {
    expect(validateUsername("dashboard")).not.toBeNull();
    expect(validateUsername("priya")).toBeNull();
  });
  it("adds India code to 10-digit WhatsApp numbers", () => {
    expect(waLink("98765 43210")).toBe("https://wa.me/919876543210");
  });
});

import { waCardLink as _wcl, waOrderLink as _wol, formatOrderTotal as _tot, formatOrderDate as _fod, parsePriceAmount as _ppa } from "./themes";
import { test as _t, expect as _e, describe as _d } from "vitest";
_t("product card opens WhatsApp with pre-filled message and India code", () => {
  const u = _wcl("98765 43210", "product", "Saree", "https://x.app/riya");
  _e(u.startsWith("https://wa.me/919876543210?text=")).toBe(true);
  _e(decodeURIComponent(u.split("text=")[1] ?? "")).toContain('"Saree"');
});

function _msg(u: string) {
  return decodeURIComponent(u.split("text=")[1] ?? "");
}

_d("complete order message", () => {
  const order = { quantity: 2, dateNeeded: "2026-12-12", fulfilment: "delivery" as const, address: "12 Rose Lane, Mumbai", note: "Happy birthday on the cake" };
  _t("carries product, quantity, total, date, delivery + address and note", () => {
    const u = _wol("98765 43210", "Chocolate cake", "https://izzytag.shop/bakery", order, { price: "₹499", shopName: "Cake Factory" });
    _e(u.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    const m = _msg(u);
    _e(m).toContain('Product: "Chocolate cake"');
    _e(m).toContain("Quantity: 2");
    _e(m).toContain("Total: ₹998");
    _e(m).toContain("Date needed: 12 Dec 2026");
    _e(m).toContain("Pickup or delivery: Delivery");
    _e(m).toContain("Delivery address: 12 Rose Lane, Mumbai");
    _e(m).toContain("Note: Happy birthday on the cake");
    _e(m).not.toContain("tell me more");
  });
  _t("pickup leaves the address line out", () => {
    const u = _wol("98765 43210", "Chocolate cake", "https://izzytag.shop/bakery", { ...order, fulfilment: "pickup", address: "" }, { price: "₹499", shopName: "Cake Factory" });
    const m = _msg(u);
    _e(m).toContain("Pickup or delivery: Pickup");
    _e(m).not.toContain("Delivery address");
  });
  _t("empty note leaves the note line out", () => {
    const u = _wol("98765 43210", "Chocolate cake", "https://izzytag.shop/bakery", { ...order, note: "  " }, { price: "₹499", shopName: "Cake Factory" });
    _e(_msg(u)).not.toContain("Note:");
  });
  _t("multiplies the total and groups Indian rupees", () => {
    _e(_tot("₹499", 3)).toBe("₹1,497");
    _e(_tot("$10", 2)).toBe("$20");
    _e(_tot("499", 2)).toBe("998");
  });
  _t("a price with no amount leaves the total line out", () => {
    const u = _wol("98765 43210", "Chocolate cake", "https://izzytag.shop/bakery", order, { price: "Price on request", shopName: "Cake Factory" });
    _e(_msg(u)).not.toContain("Total:");
    _e(_msg(u)).toContain("Quantity: 2");
  });
  _t("without a shop name it falls back to the shop URL", () => {
    const u = _wol("98765 43210", "Chocolate cake", "https://izzytag.shop/bakery", order, { price: "₹499" });
    _e(_msg(u)).toContain("https://izzytag.shop/bakery");
  });
  _t("parses grouped rupee prices and rejects empty ones", () => {
    _e(_ppa("₹1,499")).toEqual({ amount: 1499, symbol: "₹" });
    _e(_ppa("Price on request")).toBeNull();
    _e(_ppa(null)).toBeNull();
  });
  _t("formats ISO dates and passes invalid ones through", () => {
    _e(_fod("2026-12-12")).toBe("12 Dec 2026");
    _e(_fod("not-a-date")).toBe("not-a-date");
  });
});
