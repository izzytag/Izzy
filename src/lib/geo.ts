/**
 * Visitor region for pricing: "IN" (India) or "ROW" (rest of the world).
 * Izzy shows exactly ONE Pro price per visitor — never both.
 *
 * Fallback rule (client-side, no network needed): the visitor is in India
 * only when their timezone is Asia/Kolkata (Asia/Calcutta is the legacy
 * name for the same zone). A locale like en-IN alone is NOT enough — it
 * only counts together with the Kolkata timezone, so an Indian traveller
 * abroad (or a VPN user) is not mis-priced by language alone. Anything
 * unknown is ROW, which is the safe default for a $1 price.
 */
export type Region = "IN" | "ROW";

const INDIA_TIMEZONES = new Set(["Asia/Kolkata", "Asia/Calcutta"]);

export function regionFromTimezoneLocale(timezone: string | null | undefined, locale: string | null | undefined): Region {
  const tz = (timezone ?? "").trim();
  if (INDIA_TIMEZONES.has(tz)) return "IN";
  // Locale is deliberately ignored on its own: en-IN with a non-Indian
  // timezone is ROW. (When tz is Kolkata the first branch already won.)
  void locale;
  return "ROW";
}

/** Best-effort browser fallback: timezone from Intl, locale from navigator. */
export function browserRegionFallback(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    const locale = typeof navigator !== "undefined" ? navigator.language ?? null : null;
    return regionFromTimezoneLocale(tz, locale);
  } catch {
    return "ROW";
  }
}

/** Region from a two-letter country code, as sent by the hosting platform. */
export function regionFromCountryCode(country: string | null | undefined): Region | null {
  const code = (country ?? "").trim().toUpperCase();
  if (!code) return null;
  return code === "IN" ? "IN" : "ROW";
}
