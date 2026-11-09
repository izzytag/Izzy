-- 0007_analytics_source.sql — traffic source + event kind for analytics.
-- NOTE: not yet applied to the live Supabase project "izzy". Run it in
-- the SQL editor before relying on the source / kind columns.
-- Additive and safe: existing rows get source = NULL (unknown) and
-- link_clicks.kind = 'whatsapp_click' — which is truthful, because
-- every link_clicks row written so far came from a WhatsApp order/book
-- button inside a product's details dialog (the only insert site).
-- Written for Step 04 (source attribution + product-view events).
alter table public.page_views add column if not exists source text;
alter table public.link_clicks add column if not exists source text;
alter table public.link_clicks add column if not exists kind text not null default 'whatsapp_click';

-- Analytics reads filter by shop + recency; index both event tables
-- the same way so those queries stay fast as rows accumulate.
create index if not exists page_views_profile_created_idx on public.page_views (profile_id, created_at);
create index if not exists link_clicks_profile_created_idx on public.link_clicks (profile_id, created_at);
