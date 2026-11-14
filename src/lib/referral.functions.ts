import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  decideAttribution,
  isGenuinelyActive,
  isMissingReferralColumnError,
  isValidReferralUsername,
  REFERRAL_REWARD_REASON,
  type ReferralCapture,
} from "./referral";

/**
 * Referral attribution + referrer stats (server functions).
 *
 * Attribution is server-side only: the browser sends the stored
 * capture (username + timestamp), the server resolves the username
 * to a profile id and writes profiles.referred_by with the
 * service-role client. The browser client can never write that
 * column directly — the database guard in migration 0010 rejects
 * any non-service-role change to it.
 *
 * Graceful degradation: until migration 0010 is applied, the
 * referred_by column does not exist. Both functions detect that
 * specific error and report referral tracking as unavailable
 * instead of failing the page. Attribution retries on later visits
 * because the client keeps its capture in that case.
 */

async function loadAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type AttributionOutcome =
  | { attributed: true }
  | { attributed: false; reason: "invalid" | "expired" | "self" | "already" | "unknown" | "unavailable" };

export const claimReferralAttribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { refUsername?: string; capturedAt?: number }) => ({
    refUsername: String(d?.refUsername ?? "").trim().toLowerCase().slice(0, 30),
    capturedAt: Number(d?.capturedAt) || 0,
  }))
  .handler(async ({ context, data }): Promise<AttributionOutcome> => {
    const capture: ReferralCapture | null = isValidReferralUsername(data.refUsername)
      ? { username: data.refUsername, capturedAt: data.capturedAt }
      : null;
    const now = Date.now();

    // Cheap checks first: an unusable or expired capture needs no
    // database work at all.
    if (!capture || !Number.isFinite(capture.capturedAt)) return { attributed: false, reason: "invalid" };

    const admin = await loadAdmin();
    const { data: caller, error: callerError } = await admin
      .from("profiles")
      .select("id, referred_by")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) {
      if (isMissingReferralColumnError(callerError)) return { attributed: false, reason: "unavailable" };
      throw new Error("Could not record the referral. Please try again.");
    }
    if (!caller) return { attributed: false, reason: "invalid" };

    const { data: referrer, error: referrerError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", capture.username)
      .maybeSingle();
    if (referrerError) throw new Error("Could not record the referral. Please try again.");

    const decision = decideAttribution({
      capture,
      callerId: context.userId,
      callerReferredBy: caller.referred_by,
      referrerId: referrer?.id ?? null,
      now,
    });
    if (!decision.ok) return { attributed: false, reason: decision.reason };

    // Conditional write: only when referred_by is still empty, so a
    // double-submit or a race can never overwrite an attribution.
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ referred_by: decision.referrerId })
      .eq("id", context.userId)
      .is("referred_by", null)
      .select("id");
    if (updateError) {
      if (isMissingReferralColumnError(updateError)) return { attributed: false, reason: "unavailable" };
      throw new Error("Could not record the referral. Please try again.");
    }
    if (!updated || updated.length === 0) return { attributed: false, reason: "already" };
    return { attributed: true };
  });

export type ReferralStats = {
  /** False until migration 0010 is applied — counts are not meaningful. */
  available: boolean;
  /** Shops that signed up through this shop's referral link. */
  signups: number;
  /** Of those, shops that are genuinely active (see isGenuinelyActive). */
  active: number;
  /** Free Pro months earned through referral grants, all time. */
  freeMonthsEarned: number;
};

/**
 * Counts only — the referrer never sees who the referred shops are.
 * Reads go through the service role because referred shops that have
 * not claimed a username yet are invisible under the public profile
 * read policy, and signup counts must include them.
 */
export const referralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReferralStats> => {
    const admin = await loadAdmin();
    const { data: referred, error } = await admin
      .from("profiles")
      .select("id, username, whatsapp")
      .eq("referred_by", context.userId);
    if (error) {
      if (isMissingReferralColumnError(error)) {
        return { available: false, signups: 0, active: 0, freeMonthsEarned: 0 };
      }
      throw new Error("Could not load referral counts. Please try again.");
    }
    const rows = referred ?? [];
    let active = 0;
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { data: liveItems } = await admin
        .from("links")
        .select("user_id")
        .in("user_id", ids)
        .in("kind", ["product", "service"])
        .eq("enabled", true);
      const liveCounts = new Map<string, number>();
      for (const item of liveItems ?? []) {
        liveCounts.set(item.user_id, (liveCounts.get(item.user_id) ?? 0) + 1);
      }
      for (const row of rows) {
        if (isGenuinelyActive(row, liveCounts.get(row.id) ?? 0)) active += 1;
      }
    }
    // Free months earned = months granted with the referral reason,
    // summed from the audit log the grant flow writes. Each referral
    // grant is 1 month by convention; the stored months value is the
    // source of truth when it exists.
    const { data: grants } = await admin
      .from("admin_audit_log")
      .select("details")
      .eq("action", "subscription.grant_pro")
      .eq("target_user_id", context.userId)
      .eq("reason", REFERRAL_REWARD_REASON);
    let freeMonthsEarned = 0;
    for (const g of grants ?? []) {
      const details = g.details as { months?: unknown } | null;
      freeMonthsEarned += typeof details?.months === "number" && details.months > 0 ? details.months : 1;
    }
    return { available: true, signups: rows.length, active, freeMonthsEarned };
  });
