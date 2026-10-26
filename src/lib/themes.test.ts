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

import { waCardLink as _wcl } from "./themes";
import { test as _t, expect as _e } from "vitest";
_t("product card opens WhatsApp with pre-filled message and India code", () => {
  const u = _wcl("98765 43210", "product", "Saree", "https://x.app/riya");
  _e(u.startsWith("https://wa.me/919876543210?text=")).toBe(true);
  _e(decodeURIComponent(u.split("text=")[1] ?? "")).toContain('"Saree"');
});
