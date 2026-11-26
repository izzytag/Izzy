/**
 * Product categories for the Add Product form (Dashboard A).
 *
 * A seller taps ONE category (or skips it). The category suggests ONE
 * option type only — clothes get sizes, liquids get volume — and the
 * seller can add or remove choices. One option type per product, one
 * price. Stored on the links row as category (text, existing),
 * option_label (text) and options (text[]) — see
 * supabase/0011_product_options.sql. Code must keep working before
 * that migration is applied: see isMissingOptionColumnError and
 * withoutOptionFields below.
 */

export const PRODUCT_CATEGORIES = [
  "Clothes",
  "Drinks & liquids",
  "Food & bakery",
  "Beauty & care",
  "Footwear",
  "Jewellery & accessories",
  "Electronics",
  "Home & lifestyle",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type CategoryPreset = {
  /** Label shown to the buyer, e.g. "Size". Null = no preset option. */
  optionLabel: string | null;
  /** Ready choices the seller can keep, remove, or extend. */
  options: string[];
};

const PRESETS: Record<string, CategoryPreset> = {
  Clothes: { optionLabel: "Size", options: ["S", "M", "L", "XL", "XXL", "Free size"] },
  "Drinks & liquids": { optionLabel: "Volume", options: ["250 ml", "500 ml", "1 liter", "2 liter", "5 liter"] },
  "Food & bakery": { optionLabel: "Weight", options: ["250g", "500g", "1 kg", "2 kg"] },
  "Beauty & care": { optionLabel: "Size", options: ["50 ml", "100 ml", "250 ml", "50g", "100g"] },
  Footwear: { optionLabel: "Shoe size", options: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"] },
  "Jewellery & accessories": { optionLabel: null, options: [] },
  Electronics: { optionLabel: null, options: [] },
  "Home & lifestyle": { optionLabel: null, options: [] },
  Other: { optionLabel: null, options: [] },
};

/** Preset for a tapped category. Unknown / empty category = no option. */
export function presetForCategory(category: string | null | undefined): CategoryPreset {
  const key = (category ?? "").trim();
  const preset = PRESETS[key];
  if (!preset) return { optionLabel: null, options: [] };
  return { optionLabel: preset.optionLabel, options: [...preset.options] };
}

export const MAX_OPTIONS = 12;
export const MAX_OPTION_LENGTH = 30;
export const MAX_OPTION_LABEL_LENGTH = 30;

/** Trim, cap, drop blanks and duplicates (case-insensitive), cap count. */
export function sanitizeOptions(options: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of options ?? []) {
    const value = String(raw).trim().slice(0, MAX_OPTION_LENGTH);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= MAX_OPTIONS) break;
  }
  return out;
}

export function sanitizeOptionLabel(label: string | null | undefined): string | null {
  const value = (label ?? "").trim().slice(0, MAX_OPTION_LABEL_LENGTH);
  return value ? value : null;
}

/** Add one seller-written choice. Returns a new list; no-op on blank/duplicate/full. */
export function addOptionChoice(options: readonly string[], choice: string): string[] {
  return sanitizeOptions([...options, choice]);
}

/** Remove one choice by value. */
export function removeOptionChoice(options: readonly string[], choice: string): string[] {
  return sanitizeOptions(options.filter((o) => o !== choice));
}

/**
 * True when a Supabase/PostgREST error says the option columns do not
 * exist yet (migration 0011 not applied). Used to retry a save
 * without the option fields so the rest of the product still saves.
 */
export function isMissingOptionColumnError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  const mentionsColumn = message.includes("option_label") || message.includes("options");
  const missing =
    message.includes("could not find") ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    error.code === "PGRST204" ||
    error.code === "42703";
  return mentionsColumn && missing;
}

/** Copy of a links patch with the option fields removed (fallback save). */
export function withoutOptionFields<T extends Record<string, unknown>>(patch: T): Omit<T, "option_label" | "options"> {
  const { option_label: _label, options: _options, ...rest } = patch as Record<string, unknown>;
  return rest as Omit<T, "option_label" | "options">;
}

/** True when the patch actually carries option data worth retrying for. */
export function hasOptionFields(patch: Record<string, unknown>): boolean {
  return "option_label" in patch || "options" in patch;
}
