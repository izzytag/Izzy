import { describe, expect, it } from "vitest";
import {
  buildReferralLink,
  captureReferral,
  captureReferralFromSearch,
  clearReferralCapture,
  decideAttribution,
  isCaptureFresh,
  isGenuinelyActive,
  isMissingReferralColumnError,
  isValidReferralUsername,
  parseReferralParam,
  pendingReferralRewards,
  readReferralCapture,
  referralYearStart,
  REFERRAL_STORAGE_KEY,
  REFERRAL_WINDOW_MS,
  type ReferralCapture,
  type ReferralStorage,
} from "./referral";

function fakeStorage(initial: Record<string, string> = {}): ReferralStorage & { dump: () => Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
    dump: () => Object.fromEntries(map),
  };
}

const NOW = Date.UTC(2026, 10, 15, 12, 0, 0);

describe("parseReferralParam / isValidReferralUsername", () => {
  it("accepts a well-formed ?ref= username", () => {
    expect(parseReferralParam("?ref=priyaskitchen")).toBe("priyaskitchen");
    expect(parseReferralParam("?ref=shop_123&src=qr")).toBe("shop_123");
  });

  it("lowercases the value — usernames are stored lowercase", () => {
    expect(parseReferralParam("?ref=PriyaKitchen")).toBe("priyakitchen");
  });

  it("rejects missing, empty and malformed values", () => {
    expect(parseReferralParam("")).toBe(null);
    expect(parseReferralParam("?src=qr")).toBe(null);
    expect(parseReferralParam("?ref=")).toBe(null);
    expect(parseReferralParam("?ref=ab")).toBe(null); // too short
    expect(parseReferralParam(`?ref=${"a".repeat(31)}`)).toBe(null); // too long
    expect(parseReferralParam("?ref=priya-kitchen")).toBe(null); // hyphen not allowed
    expect(parseReferralParam("?ref=priya kitchen")).toBe(null);
    expect(parseReferralParam("?ref=<script>")).toBe(null);
  });

  it("rejects reserved words — they can never be a shop", () => {
    expect(parseReferralParam("?ref=admin")).toBe(null);
    expect(parseReferralParam("?ref=dashboard")).toBe(null);
    expect(isValidReferralUsername("izzy")).toBe(false);
  });
});

describe("capture window", () => {
  const capture: ReferralCapture = { username: "priya", capturedAt: NOW };

  it("is fresh inside 30 days, including exactly at the boundary", () => {
    expect(isCaptureFresh(capture, NOW)).toBe(true);
    expect(isCaptureFresh(capture, NOW + 29 * 864e5)).toBe(true);
    expect(isCaptureFresh(capture, NOW + REFERRAL_WINDOW_MS)).toBe(true);
  });

  it("is stale one millisecond past 30 days", () => {
    expect(isCaptureFresh(capture, NOW + REFERRAL_WINDOW_MS + 1)).toBe(false);
  });

  it("rejects captures timestamped in the future", () => {
    expect(isCaptureFresh(capture, NOW - 1000)).toBe(false);
  });

  it("rejects malformed captures", () => {
    expect(isCaptureFresh({ username: "", capturedAt: NOW }, NOW)).toBe(false);
    expect(isCaptureFresh({ username: "priya", capturedAt: Number.NaN }, NOW)).toBe(false);
  });
});

describe("captureReferral (first-touch storage)", () => {
  it("stores a new capture with username + timestamp", () => {
    const storage = fakeStorage();
    const got = captureReferral(storage, "priya", NOW);
    expect(got).toEqual({ username: "priya", capturedAt: NOW });
    expect(JSON.parse(storage.dump()[REFERRAL_STORAGE_KEY] ?? "{}")).toEqual({ username: "priya", capturedAt: NOW });
  });

  it("first touch wins — a fresh existing capture is never overwritten", () => {
    const storage = fakeStorage({
      [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "first", capturedAt: NOW - 1000 }),
    });
    expect(captureReferral(storage, "second", NOW)).toEqual({ username: "first", capturedAt: NOW - 1000 });
  });

  it("an expired capture is replaced by the new one", () => {
    const storage = fakeStorage({
      [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "old", capturedAt: NOW - REFERRAL_WINDOW_MS - 1 }),
    });
    expect(captureReferral(storage, "newshop", NOW)).toEqual({ username: "newshop", capturedAt: NOW });
  });

  it("stores nothing for an invalid username", () => {
    const storage = fakeStorage();
    expect(captureReferral(storage, "not valid!", NOW)).toBe(null);
    expect(captureReferral(storage, null, NOW)).toBe(null);
    expect(storage.dump()).toEqual({});
  });

  it("captureReferralFromSearch wires the query string to storage", () => {
    const storage = fakeStorage();
    expect(captureReferralFromSearch("?ref=priya", storage, NOW)).toEqual({ username: "priya", capturedAt: NOW });
    expect(captureReferralFromSearch("?ref=nope!", fakeStorage(), NOW)).toBe(null);
  });
});

describe("readReferralCapture", () => {
  it("returns a fresh capture", () => {
    const storage = fakeStorage({
      [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "priya", capturedAt: NOW }),
    });
    expect(readReferralCapture(storage, NOW)).toEqual({ username: "priya", capturedAt: NOW });
  });

  it("clears and ignores a stale capture", () => {
    const storage = fakeStorage({
      [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "priya", capturedAt: NOW - REFERRAL_WINDOW_MS - 1 }),
    });
    expect(readReferralCapture(storage, NOW)).toBe(null);
    expect(storage.dump()).toEqual({});
  });

  it("ignores malformed stored values", () => {
    expect(readReferralCapture(fakeStorage({ [REFERRAL_STORAGE_KEY]: "not json" }), NOW)).toBe(null);
    expect(readReferralCapture(fakeStorage({ [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "x" }) }), NOW)).toBe(null);
    expect(readReferralCapture(fakeStorage({ [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "admin", capturedAt: NOW }) }), NOW)).toBe(null);
  });

  it("clearReferralCapture removes the stored value", () => {
    const storage = fakeStorage({ [REFERRAL_STORAGE_KEY]: JSON.stringify({ username: "priya", capturedAt: NOW }) });
    clearReferralCapture(storage);
    expect(storage.dump()).toEqual({});
  });
});

describe("buildReferralLink", () => {
  it("builds the canonical referral link", () => {
    expect(buildReferralLink("https://izzytag.shop", "priya")).toBe("https://izzytag.shop/?ref=priya");
    expect(buildReferralLink("https://izzytag.shop/", "priya")).toBe("https://izzytag.shop/?ref=priya");
  });
});

describe("isGenuinelyActive", () => {
  it("requires username, WhatsApp and at least one live item", () => {
    const full = { username: "priya", whatsapp: "919876543210" };
    expect(isGenuinelyActive(full, 1)).toBe(true);
    expect(isGenuinelyActive(full, 3)).toBe(true);
    expect(isGenuinelyActive(full, 0)).toBe(false);
    expect(isGenuinelyActive({ username: null, whatsapp: "919876543210" }, 2)).toBe(false);
    expect(isGenuinelyActive({ username: "priya", whatsapp: null }, 2)).toBe(false);
    expect(isGenuinelyActive({ username: null, whatsapp: null }, 0)).toBe(false);
  });
});

describe("decideAttribution", () => {
  const base = {
    capture: { username: "priya", capturedAt: NOW } as ReferralCapture,
    callerId: "caller-id",
    callerReferredBy: null as string | null,
    referrerId: "referrer-id" as string | null,
    now: NOW,
  };

  it("attributes when every rule passes", () => {
    expect(decideAttribution(base)).toEqual({ ok: true, referrerId: "referrer-id" });
  });

  it("rejects a missing or malformed capture", () => {
    expect(decideAttribution({ ...base, capture: null })).toEqual({ ok: false, reason: "invalid" });
    expect(decideAttribution({ ...base, capture: { username: "", capturedAt: NOW } })).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an expired capture (30-day window)", () => {
    expect(
      decideAttribution({ ...base, capture: { username: "priya", capturedAt: NOW - REFERRAL_WINDOW_MS - 1 } }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects when the account already has a referrer (one attribution)", () => {
    expect(decideAttribution({ ...base, callerReferredBy: "someone-else" })).toEqual({ ok: false, reason: "already" });
  });

  it("rejects an unknown username (no profile resolves)", () => {
    expect(decideAttribution({ ...base, referrerId: null })).toEqual({ ok: false, reason: "unknown" });
  });

  it("rejects self-referral", () => {
    expect(decideAttribution({ ...base, referrerId: "caller-id" })).toEqual({ ok: false, reason: "self" });
  });

  it("checks expiry before already-attributed, so an old capture never overwrites", () => {
    expect(
      decideAttribution({
        ...base,
        capture: { username: "priya", capturedAt: NOW - REFERRAL_WINDOW_MS - 1 },
        callerReferredBy: "someone-else",
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });
});

describe("pendingReferralRewards (cap math)", () => {
  it("owes one month per active referral", () => {
    expect(pendingReferralRewards(3, 0)).toBe(3);
    expect(pendingReferralRewards(1, 0)).toBe(1);
    expect(pendingReferralRewards(0, 0)).toBe(0);
  });

  it("caps at 6 per year", () => {
    expect(pendingReferralRewards(10, 0)).toBe(6);
    expect(pendingReferralRewards(6, 0)).toBe(6);
  });

  it("subtracts months already granted this year", () => {
    expect(pendingReferralRewards(4, 1)).toBe(3);
    expect(pendingReferralRewards(6, 6)).toBe(0);
  });

  it("never goes below zero when grants exceed the cap", () => {
    expect(pendingReferralRewards(2, 6)).toBe(0);
    expect(pendingReferralRewards(0, 3)).toBe(0);
  });

  it("treats negative inputs as zero", () => {
    expect(pendingReferralRewards(-2, 0)).toBe(0);
    expect(pendingReferralRewards(3, -1)).toBe(3);
  });
});

describe("referralYearStart", () => {
  it("is 1 January UTC of the current year", () => {
    expect(referralYearStart(new Date(Date.UTC(2026, 10, 15)))).toBe("2026-01-01T00:00:00.000Z");
    expect(referralYearStart(new Date(Date.UTC(2027, 0, 1)))).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("isMissingReferralColumnError", () => {
  it("detects the undefined-column error for referred_by", () => {
    expect(isMissingReferralColumnError({ code: "42703", message: "column profiles.referred_by does not exist" })).toBe(true);
    expect(isMissingReferralColumnError({ message: "column profiles.referred_by does not exist" })).toBe(true);
    expect(isMissingReferralColumnError({ code: "42703", message: "something else" })).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(isMissingReferralColumnError(null)).toBe(false);
    expect(isMissingReferralColumnError({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isMissingReferralColumnError({ message: "column profiles.username does not exist" })).toBe(false);
    expect(isMissingReferralColumnError({})).toBe(false);
  });
});
