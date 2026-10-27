import { describe, it, expect } from "vitest";
import { regionFromTimezoneLocale, regionFromCountryCode } from "./geo";

describe("region fallback (timezone/locale)", () => {
  it("Asia/Kolkata is India", () => {
    expect(regionFromTimezoneLocale("Asia/Kolkata", "en-US")).toBe("IN");
    expect(regionFromTimezoneLocale("Asia/Calcutta", "en-IN")).toBe("IN");
    expect(regionFromTimezoneLocale("Asia/Kolkata", "en-IN")).toBe("IN");
  });
  it("locale alone never makes India", () => {
    expect(regionFromTimezoneLocale("America/New_York", "en-IN")).toBe("ROW");
    expect(regionFromTimezoneLocale("Europe/London", "en-IN")).toBe("ROW");
  });
  it("unknown timezone is rest of world", () => {
    expect(regionFromTimezoneLocale(null, null)).toBe("ROW");
    expect(regionFromTimezoneLocale("", "")).toBe("ROW");
    expect(regionFromTimezoneLocale("America/New_York", "en-US")).toBe("ROW");
  });
});

describe("region from country code", () => {
  it("IN maps to India, anything else to rest of world", () => {
    expect(regionFromCountryCode("IN")).toBe("IN");
    expect(regionFromCountryCode("in")).toBe("IN");
    expect(regionFromCountryCode("US")).toBe("ROW");
    expect(regionFromCountryCode(null)).toBeNull();
    expect(regionFromCountryCode("")).toBeNull();
  });
});
