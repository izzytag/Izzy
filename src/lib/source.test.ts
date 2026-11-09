import { describe, expect, it } from "vitest";
import { deriveSource, sanitizeSourceParam, sourceLabel } from "./source";

describe("sanitizeSourceParam", () => {
  it("lowercases and keeps URL-safe characters", () => {
    expect(sanitizeSourceParam("Instagram_Bio-2")).toBe("instagram_bio-2");
  });
  it("turns spaces and symbols into single dashes", () => {
    expect(sanitizeSourceParam("WhatsApp Status!")).toBe("whatsapp-status");
    expect(sanitizeSourceParam("  my   stall @ expo  ")).toBe("my-stall-expo");
  });
  it("caps the length at 32 characters", () => {
    expect(sanitizeSourceParam("a".repeat(50))).toHaveLength(32);
  });
  it("returns null for empty or symbol-only input", () => {
    expect(sanitizeSourceParam(null)).toBeNull();
    expect(sanitizeSourceParam(undefined)).toBeNull();
    expect(sanitizeSourceParam("")).toBeNull();
    expect(sanitizeSourceParam("!!!")).toBeNull();
  });
});

describe("deriveSource", () => {
  it("prefers the src parameter over everything else", () => {
    expect(
      deriveSource({ src: "qr", utmSource: "newsletter", referrer: "https://www.instagram.com/", ownHost: "izzytag.shop" }),
    ).toBe("qr");
  });
  it("falls back to utm_source, sanitised", () => {
    expect(deriveSource({ utmSource: "Instagram Bio", referrer: "https://google.com/" })).toBe("instagram-bio");
  });
  it("maps known referrer hosts", () => {
    expect(deriveSource({ referrer: "https://www.instagram.com/p/abc/" })).toBe("instagram");
    expect(deriveSource({ referrer: "https://l.facebook.com/l.php?u=x" })).toBe("facebook");
    expect(deriveSource({ referrer: "https://api.whatsapp.com/send" })).toBe("whatsapp");
    expect(deriveSource({ referrer: "https://www.google.co.in/search?q=x" })).toBe("google");
  });
  it("labels other referrers as referral", () => {
    expect(deriveSource({ referrer: "https://someblog.example/post" })).toBe("referral");
  });
  it("treats same-host and missing referrers as direct", () => {
    expect(deriveSource({ referrer: "https://izzytag.shop/pricing", ownHost: "izzytag.shop" })).toBe("direct");
    expect(deriveSource({ referrer: "" })).toBe("direct");
    expect(deriveSource({ referrer: null })).toBe("direct");
    expect(deriveSource({ referrer: "not a url" })).toBe("direct");
  });
  it("ignores a src parameter that sanitises to nothing", () => {
    expect(deriveSource({ src: "!!!", referrer: "https://www.instagram.com/" })).toBe("instagram");
  });
});

describe("sourceLabel", () => {
  it("groups campaign labels into their channel", () => {
    expect(sourceLabel("instagram-bio")).toBe("Instagram");
    expect(sourceLabel("whatsapp-status")).toBe("WhatsApp");
    expect(sourceLabel("facebook")).toBe("Facebook");
  });
  it("labels the built-in sources", () => {
    expect(sourceLabel("qr")).toBe("QR code");
    expect(sourceLabel("google")).toBe("Google");
    expect(sourceLabel("direct")).toBe("Direct");
    expect(sourceLabel("referral")).toBe("Other referral");
  });
  it("is honest about the rest", () => {
    expect(sourceLabel("expo-stall")).toBe("Other");
    expect(sourceLabel(null)).toBe("Unknown");
  });
});
