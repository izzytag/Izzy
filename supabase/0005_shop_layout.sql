-- 0005_shop_layout.sql — store product layout choice.
-- NOTE: for future setups only. This was already applied to the live
-- Supabase project "izzy" on 2026-10-27, so do NOT run it again live.
-- NOTE 2026-10-27: the Pinterest-style store no longer reads this
-- column. It stays in the database unused; nothing here drops it.
-- Side by side = 'grid' (the default, today's look).
-- Scrollable = 'scroll' (single vertical list).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_layout text NOT NULL DEFAULT 'grid'
  CHECK (shop_layout IN ('grid', 'scroll'));
