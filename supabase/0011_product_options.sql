-- 0011_product_options.sql
-- Product options for category-based selling (Dashboard A, preview only).
-- Adds ONE optional option type per product: e.g. Size [S, M, L] for
-- clothes, Volume [250 ml, 1 liter] for liquids. The seller chooses a
-- product category in Add Product; the category suggests the label and
-- ready choices, and the seller can add their own.
--
-- NOT APPLIED by the preview build. Apply separately in Supabase
-- (SQL editor / migration) before categories can save live. Until then
-- the app degrades gracefully: reads fall back to no options and saves
-- retry without these columns (see src/lib/product-categories.ts).

alter table public.links
  add column if not exists option_label text,
  add column if not exists options text[] not null default '{}';

comment on column public.links.option_label is 'Buyer-facing option name for this product, e.g. Size, Volume, Weight. Null = no option.';
comment on column public.links.options is 'Choices for option_label, e.g. {S,M,L,XL}. Empty = no option picker.';
