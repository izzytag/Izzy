/**
 * Admin panel — pure helpers (Step 06).
 *
 * There is no admin role in the schema. Admin access is an allowlist:
 * the server env var ADMIN_EMAILS (comma-separated, case-insensitive).
 * Unset/empty means admin is closed for EVERYONE — the safe default;
 * the owner enables it by setting the env var on the server. These
 * helpers only parse and match; the env read and the session check
 * happen inside the admin server functions (admin.functions.ts), which
 * re-check the allowlist on every single call.
 */

export function parseAdminEmails(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isAdminEmail(email: string | null | undefined, allowlist: string[]): boolean {
  if (!email || allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

/** Support ticket statuses (brief §6). Stored on contact_messages. */
export const TICKET_STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export function isTicketStatus(v: string): v is TicketStatus {
  return (TICKET_STATUSES as readonly string[]).includes(v);
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting for user",
  resolved: "Resolved",
  closed: "Closed",
};

/** Support form categories — exactly the brief's list (§6). */
export const SUPPORT_CATEGORIES = [
  "Account and login",
  "Shop setup",
  "Products",
  "WhatsApp integration",
  "Subscription and payments",
  "Other",
] as const;

/** Report reasons on the public storefront (brief §7). */
export const REPORT_REASONS = [
  "Inappropriate listing",
  "Misleading information",
  "Spam",
  "Suspicious activity",
  "Other",
] as const;

export const REPORT_STATUSES = ["open", "reviewed", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Trim + hard length cap, applied server-side to every new form input. */
export function capText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

/** A reason is mandatory for sensitive admin actions (suspend, grant, revoke). */
export function requireReason(value: unknown): string | null {
  const r = capText(value, 500);
  return r.length > 0 ? r : null;
}

/**
 * Manual Pro grants run in whole months of 30 days — the same month
 * length the verified-payment activation uses (verifyRazorpayPayment
 * sets current_period_end to now + 30 days).
 */
export function grantPeriodEnd(months: number, now: Date = new Date()): string {
  return new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
}

export const GRANT_MONTHS = [1, 6, 12] as const;

/**
 * Validate a storefront report. Returns the sanitised fields, or null
 * when the reason isn't one of the known values. The username itself
 * is looked up server-side afterwards; a report for an unknown shop is
 * accepted-and-dropped by the caller so the endpoint never reveals
 * whether a username exists.
 */
export function validateReportInput(input: {
  username?: unknown;
  reason?: unknown;
  details?: unknown;
  reporterEmail?: unknown;
}): { username: string; reason: string; details: string | null; reporterEmail: string | null } | null {
  const username = capText(input.username, 30).toLowerCase();
  const reason = capText(input.reason, 60);
  if (!username || !(REPORT_REASONS as readonly string[]).includes(reason)) return null;
  const details = capText(input.details, 1000);
  const email = capText(input.reporterEmail, 120);
  return {
    username,
    reason,
    details: details || null,
    reporterEmail: email && email.includes("@") ? email : null,
  };
}
