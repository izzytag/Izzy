-- 0006_profile_category.sql — business category for profiles.
-- NOTE: not yet applied to the live Supabase project "izzy". Run it in
-- the SQL editor before relying on the profiles.category column.
-- Additive and safe: existing rows simply get NULL (no category chosen).
-- Written for Step 02 (onboarding + My Shop both collect the category).
alter table public.profiles add column if not exists category text;
