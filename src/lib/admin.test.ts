import { describe, expect, it } from "vitest";
import {
  capText,
  grantPeriodEnd,
  isAdminEmail,
  isTicketStatus,
  parseAdminEmails,
  requireReason,
  validateReportInput,
} from "./admin";

describe("parseAdminEmails", () => {
  it("returns [] for unset/empty values — admin closed by default", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails(null)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
    expect(parseAdminEmails("  , ,")).toEqual([]);
  });

  it("splits, trims and lowercases", () => {
    expect(parseAdminEmails("Owner@Example.com, second@izzytag.shop ")).toEqual([
      "owner@example.com",
      "second@izzytag.shop",
    ]);
  });
});

describe("isAdminEmail", () => {
  const list = parseAdminEmails("owner@example.com,second@izzytag.shop");

  it("matches case-insensitively", () => {
    expect(isAdminEmail("OWNER@example.com", list)).toBe(true);
    expect(isAdminEmail(" second@izzytag.shop ", list)).toBe(true);
  });

  it("denies everyone when the allowlist is empty (env unset)", () => {
    expect(isAdminEmail("owner@example.com", [])).toBe(false);
  });

  it("denies unlisted and missing emails", () => {
    expect(isAdminEmail("someone@else.com", list)).toBe(false);
    expect(isAdminEmail(null, list)).toBe(false);
    expect(isAdminEmail(undefined, list)).toBe(false);
  });
});

describe("ticket statuses", () => {
  it("accepts only the five workflow states", () => {
    for (const s of ["open", "in_progress", "waiting", "resolved", "closed"]) {
      expect(isTicketStatus(s)).toBe(true);
    }
    expect(isTicketStatus("deleted")).toBe(false);
    expect(isTicketStatus("")).toBe(false);
  });
});

describe("capText / requireReason", () => {
  it("trims and caps length", () => {
    expect(capText("  hello  ", 100)).toBe("hello");
    expect(capText("abcdef", 3)).toBe("abc");
    expect(capText(null, 5)).toBe("");
  });

  it("requires a non-empty reason for sensitive actions", () => {
    expect(requireReason("")).toBeNull();
    expect(requireReason("   ")).toBeNull();
    expect(requireReason("Spam shop reported by 3 users")).toBe("Spam shop reported by 3 users");
  });
});

describe("grantPeriodEnd", () => {
  it("adds 30 days per month, like the verified-payment activation", () => {
    const now = new Date("2026-11-10T00:00:00.000Z");
    expect(grantPeriodEnd(1, now)).toBe("2026-12-10T00:00:00.000Z");
    expect(grantPeriodEnd(6, now)).toBe("2027-05-09T00:00:00.000Z");
    expect(grantPeriodEnd(12, now)).toBe("2027-11-05T00:00:00.000Z");
  });
});

describe("validateReportInput", () => {
  it("accepts a known reason and sanitises fields", () => {
    const r = validateReportInput({
      username: " SomeShop ",
      reason: "Spam",
      details: "  fake products  ",
      reporterEmail: "a@b.com",
    });
    expect(r).toEqual({
      username: "someshop",
      reason: "Spam",
      details: "fake products",
      reporterEmail: "a@b.com",
    });
  });

  it("rejects unknown reasons and empty usernames", () => {
    expect(validateReportInput({ username: "shop", reason: "Whatever" })).toBeNull();
    expect(validateReportInput({ username: "", reason: "Spam" })).toBeNull();
  });

  it("drops malformed reporter emails instead of storing them", () => {
    const r = validateReportInput({ username: "shop", reason: "Other", reporterEmail: "not-an-email" });
    expect(r?.reporterEmail).toBeNull();
  });
});
