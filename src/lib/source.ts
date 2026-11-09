/**
 * Traffic-source derivation for storefront analytics.
 *
 * Pure functions (no browser or Supabase access) so they can be unit
 * tested. A "source" is a short label saying how a visitor arrived:
 * a ?src= / ?utm_source= link label when the link carries one, else a
 * label derived from the referrer host, else "direct". Labels are
 * deliberately coarse — we never guess beyond what the link or the
 * referrer actually tells us.
 */

const MAX_SOURCE_LEN = 32;

/** Normalise a raw link label: lowercase, URL-safe, short. */
export function sanitizeSourceParam(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, MAX_SOURCE_LEN);
  return s || null;
}

export function deriveSource(input: {
  src?: string | null;
  utmSource?: string | null;
  referrer?: string | null;
  ownHost?: string | null;
}): string {
  const fromParam = sanitizeSourceParam(input.src) ?? sanitizeSourceParam(input.utmSource);
  if (fromParam) return fromParam;

  const ref = input.referrer?.trim();
  if (!ref) return "direct";
  let host = "";
  try {
    host = new URL(ref).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (!host) return "direct";
  // Arriving from another page on the same site is not a source.
  if (input.ownHost && host === input.ownHost.toLowerCase()) return "direct";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "facebook.com" || host.endsWith(".facebook.com")) return "facebook";
  if (host === "whatsapp.com" || host.endsWith(".whatsapp.com") || host === "wa.me") return "whatsapp";
  if (host.includes("google.")) return "google";
  return "referral";
}

/**
 * Group a stored source value into the label shown in Analytics.
 * Campaign labels fold into their channel ("instagram-bio" counts as
 * Instagram); anything unrecognised is honestly "Other".
 */
export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "Unknown";
  const s = source.toLowerCase();
  if (s.startsWith("instagram")) return "Instagram";
  if (s.startsWith("facebook")) return "Facebook";
  if (s.startsWith("whatsapp")) return "WhatsApp";
  if (s === "qr") return "QR code";
  if (s.startsWith("google")) return "Google";
  if (s === "direct") return "Direct";
  if (s === "referral") return "Other referral";
  return "Other";
}
