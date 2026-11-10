/**
 * Business categories offered in onboarding and in My Shop.
 * Stored as free text in profiles.category (see
 * supabase/0006_profile_category.sql) — the list lives here so both
 * surfaces always offer exactly the same options.
 */
export const BUSINESS_CATEGORIES = [
  "Fashion & Clothing",
  "Beauty & Cosmetics",
  "Food & Bakery",
  "Electronics",
  "Home & Lifestyle",
  "Jewellery & Accessories",
  "Services",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
