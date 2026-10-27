import { describe, it, expect } from "vitest";
import { PRO_PRICE_INR, PRO_PRICE_USD, PRO_PRICE_DISPLAY_LINE, TESTING_FREE, effectiveIsPro } from "./billing";

describe("izzy pricing (test phase)", () => {
  it("prices India at ₹99 and the rest of the world at $1", () => {
    expect(PRO_PRICE_INR).toBe(99);
    expect(PRO_PRICE_USD).toBe(1);
    expect(PRO_PRICE_DISPLAY_LINE).toContain("₹99");
    expect(PRO_PRICE_DISPLAY_LINE).toContain("$1");
  });
  it("testing flag gives everyone Pro display behaviour", () => {
    expect(TESTING_FREE).toBe(true);
    expect(effectiveIsPro(false)).toBe(true);
    expect(effectiveIsPro(true)).toBe(true);
  });
});
