/**
 * Referral system — pure logic (no browser or Supabase access except
 * through the injected storage argument, so everything here is unit
 * testable).
 *
 * How it works:
 * - Every shop gets a referral link: izzytag.shop/?ref=<username>.
 * - Landing on the homepage with ?ref= stores a first-touch capture
 *   (username + timestamp) in localStorage.
 * - On the new account's first profile save, the capture is sent to
 *   a server function that resolves the username to a profile id and
 *   sets profiles.referred_by — server-side only. The browser client
 *   can never write referred_by directly (the database guard in
 *   0010_referral_attribution.sql rejects it).
 * - A referral earns its reward only when the referred shop becomes
 *   genuinely active: username claimed, WhatsApp number set, and at
 *   least one live (enabled) product.
 * - Reward: 1 month of Pro free per genuinely active referral, capped
 *   at 6 free months per referrer per calendar year, no cash.
 *   Fulfilment is manual admin review through the existing grant flow
 *   — there is deliberately no automatic grant.
 *
 * Abuse rules, enforced by decideAttribution + the server function:
 * - No self-referral. One attribution per account (first touch wins).
 * - 30-day attribution window from capture to signup save.
 * - Rewards are granted only after manual admin review.
 */

import { validateUsername } from "./themes";

/** Attribution window: capture to first profile save, in days. */
export const REFERRAL_WINDOW_DAYS = 30;
export const REFERRAL_WINDOW_MS = REFERRAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Maximum free Pro months a referrer can earn per calendar year. */
export const REFERRAL_REWARD_CAP_PER_YEAR = 6;

/** Free Pro months earned per genuinely active referral. */
export const REFERRAL_REWARD_MONTHS = 1;

/**
 * Exact reason recorded on referral grants. The admin review page
 * counts granted rewards by matching this reason in the audit log,
 * so the grant flow must use it verbatim.
 */
export const REFERRAL_REWARD_REASON = "Referral reward";

/** localStorage key for the first-touch referral capture. */
export const REFERRAL_STORAGE_KEY = "izzy-referral";

export type ReferralCapture = { username: string; capturedAt: number };

/** Minimal storage surface — localStorage in the app, a fake in tests. */
export type ReferralStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/**
 * A referral username must be a claimable shop username: the same
 * rule the onboarding form enforces (3–30 lowercase letters, numbers
 * or underscore, not a reserved word). The server resolves it to a
 * real profile afterwards; this check only rejects malformed values
 * before anything is stored.
 */
export function isValidReferralUsername(value: string): boolean {
  return validateUsername(value) === null;
}

/** Extract and validate the ?ref= value from a query string. */
export function parseReferralParam(search: string): string | null {
  let ref: string | null = null;
  try {
    ref = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get("ref");
  } catch {
    return null;
  }
  if (!ref) return null;
  const username = ref.trim().toLowerCase();
  return isValidReferralUsername(username) ? username : null;
}

/** True when the capture is within the 30-day window and not from the future. */
export function isCaptureFresh(capture: ReferralCapture, now: number): boolean {
  if (!capture.username || !Number.isFinite(capture.capturedAt)) return false;
  return capture.capturedAt <= now && now - capture.capturedAt <= REFERRAL_WINDOW_MS;
}

function parseCapture(raw: string | null): ReferralCapture | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ReferralCapture>;
    if (typeof parsed.username !== "string" || typeof parsed.capturedAt !== "number") return null;
    if (!isValidReferralUsername(parsed.username)) return null;
    return { username: parsed.username, capturedAt: parsed.capturedAt };
  } catch {
    return null;
  }
}

/**
 * Read the stored capture, but only while it is fresh. A stale or
 * malformed value is cleared and reads as absent.
 */
export function readReferralCapture(storage: ReferralStorage, now: number): ReferralCapture | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
  const capture = parseCapture(raw);
  if (!capture) return null;
  if (!isCaptureFresh(capture, now)) {
    clearReferralCapture(storage);
    return null;
  }
  return capture;
}

export function clearReferralCapture(storage: ReferralStorage): void {
  try {
    storage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode) — nothing to clear.
  }
}

/**
 * First-touch capture: if a fresh capture already exists it wins and
 * is returned unchanged; otherwise the new username is stored.
 * Returns the effective capture, or null when nothing valid was
 * supplied and nothing fresh was stored.
 */
export function captureReferral(
  storage: ReferralStorage,
  username: string | null,
  now: number,
): ReferralCapture | null {
  const existing = readReferralCapture(storage, now);
  if (existing) return existing;
  if (!username || !isValidReferralUsername(username)) return null;
  const capture: ReferralCapture = { username, capturedAt: now };
  try {
    storage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(capture));
  } catch {
    return capture; // Stored nowhere, but the caller may still use it.
  }
  return capture;
}

/** Capture a ?ref= value straight from the landing page's query string. */
export function captureReferralFromSearch(
  search: string,
  storage: ReferralStorage,
  now: number,
): ReferralCapture | null {
  return captureReferral(storage, parseReferralParam(search), now);
}

/** The shareable referral link for a shop. */
export function buildReferralLink(origin: string, username: string): string {
  return `${origin.replace(/\/$/, "")}/?ref=${username}`;
}

/**
 * Genuinely active: the shop can actually take orders — a claimed
 * shop link, a WhatsApp number for customers to reach, and at least
 * one live product. Mere signup earns nothing.
 */
export function isGenuinelyActive(
  profile: { username: string | null; whatsapp: string | null },
  liveItemCount: number,
): boolean {
  return !!profile.username && !!profile.whatsapp && liveItemCount >= 1;
}

export type AttributionDecision =
  | { ok: true; referrerId: string }
  | { ok: false; reason: "invalid" | "expired" | "self" | "already" | "unknown" };

/**
 * Pure attribution decision. The server function performs the
 * database lookups (caller profile, username resolution) and then
 * calls this — every abuse rule is decided here and unit tested.
 *
 * - invalid: no usable capture (missing username or timestamp).
 * - expired: capture older than the 30-day window.
 * - self: the referrer resolved to the caller's own account.
 * - already: the account already has a referrer recorded.
 * - unknown: the username does not resolve to any profile.
 */
export function decideAttribution(input: {
  capture: ReferralCapture | null;
  callerId: string;
  callerReferredBy: string | null;
  referrerId: string | null;
  now: number;
}): AttributionDecision {
  const { capture, callerId, callerReferredBy, referrerId, now } = input;
  if (!capture || !capture.username || !Number.isFinite(capture.capturedAt)) {
    return { ok: false, reason: "invalid" };
  }
  if (!isCaptureFresh(capture, now)) return { ok: false, reason: "expired" };
  if (callerReferredBy) return { ok: false, reason: "already" };
  if (!referrerId) return { ok: false, reason: "unknown" };
  if (referrerId === callerId) return { ok: false, reason: "self" };
  return { ok: true, referrerId };
}

/**
 * Rewards still owed to a referrer: active referrals up to the yearly
 * cap, minus the free months already granted this year. Never below
 * zero. Referrals that became active in an earlier year and were
 * never granted count against the current year's cap — the cap
 * limits grants per year, not referrals per year.
 */
export function pendingReferralRewards(
  activeCount: number,
  grantedMonthsThisYear: number,
  cap: number = REFERRAL_REWARD_CAP_PER_YEAR,
): number {
  return Math.max(0, Math.min(Math.max(0, activeCount), cap) - Math.max(0, grantedMonthsThisYear));
}

/** Start of the calendar year (UTC) containing `now` — the cap window. */
export function referralYearStart(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
}

/**
 * True when a Supabase error means the profiles.referred_by column
 * does not exist yet (migration 0010 not applied). Callers degrade
 * gracefully in that case instead of failing the page: referral
 * tracking simply is not active until the migration is applied.
 */
export function isMissingReferralColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = error.message ?? "";
  return message.includes("referred_by") && /does not exist/i.test(message);
}
