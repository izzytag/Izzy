import { describe, it, expect } from "vitest";
import { PRO_PRICE_INR, PRO_PRICE_USD, proPriceLine, testingBanner, TESTING_FREE, effectiveIsPro, planDisplayState } from "./billing";

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
  it("live paywall: only real Pro subscribers get Pro display behaviour", () => {
    expect(TESTING_FREE).toBe(false);
    expect(effectiveIsPro(false)).toBe(false);
    expect(effectiveIsPro(true)).toBe(true);
  });
});

describe("planDisplayState (Plan page)", () => {
  const now = new Date("2026-11-10T00:00:00.000Z");
  const future = "2026-12-01T00:00:00.000Z";
  const past = "2026-10-01T00:00:00.000Z";

  it("is Free when there is no row or the row is the Free plan", () => {
    expect(planDisplayState(null, now)).toEqual({ kind: "free" });
    expect(planDisplayState({ plan: "free", status: "active", current_period_end: null }, now)).toEqual({ kind: "free" });
  });
  it("is Active while the paid period is running, with or without a stored end", () => {
    expect(planDisplayState({ plan: "pro", status: "active", current_period_end: future }, now)).toEqual({ kind: "active", periodEnd: future });
    expect(planDisplayState({ plan: "pro", status: "active", current_period_end: null }, now)).toEqual({ kind: "active", periodEnd: null });
  });
  it("is Expired once an active row's paid period has passed", () => {
    expect(planDisplayState({ plan: "pro", status: "active", current_period_end: past }, now)).toEqual({ kind: "expired", periodEnd: past });
  });
  it("is Cancelled when the row says cancelled, whatever the period end", () => {
    expect(planDisplayState({ plan: "pro", status: "cancelled", current_period_end: past }, now)).toEqual({ kind: "cancelled", periodEnd: past });
    expect(planDisplayState({ plan: "pro", status: "cancelled", current_period_end: null }, now)).toEqual({ kind: "cancelled", periodEnd: null });
  });
  it("shows an unknown Pro status as stored rather than inventing one", () => {
    expect(planDisplayState({ plan: "pro", status: "halted", current_period_end: future }, now)).toEqual({ kind: "other", status: "halted", periodEnd: future });
  });
});
