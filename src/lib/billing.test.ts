import { describe, it, expect } from "vitest";
import { PRO_PRICE_INR, PRO_PRICE_USD, proPriceLine, testingBanner, TESTING_FREE, effectiveIsPro } from "./billing";

describe("izzy pricing (test phase)", () => {
  it("prices India at ₹99 and the rest of the world at $1", () => {
    expect(PRO_PRICE_INR).toBe(99);
    expect(PRO_PRICE_USD).toBe(1);
  });
  it("shows exactly one price per region, never both", () => {
    expect(proPriceLine("IN")).toBe("₹99/month");
    expect(proPriceLine("IN")).not.toContain("$");
    expect(proPriceLine("ROW")).toBe("$1/month");
    expect(proPriceLine("ROW")).not.toContain("₹");
    expect(proPriceLine("loading")).toBe("Pro — monthly");
    expect(proPriceLine("loading")).not.toContain("₹");
    expect(proPriceLine("loading")).not.toContain("$1");
  });
  it("testing banner is region-specific, never both prices", () => {
    expect(testingBanner("IN")).toContain("₹99");
    expect(testingBanner("IN")).not.toContain("$1");
    expect(testingBanner("ROW")).toContain("$1");
    expect(testingBanner("ROW")).not.toContain("₹99");
  });
  it("testing flag gives everyone Pro display behaviour", () => {
    expect(TESTING_FREE).toBe(true);
    expect(effectiveIsPro(false)).toBe(true);
    expect(effectiveIsPro(true)).toBe(true);
  });
});
