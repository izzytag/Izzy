-- 0008_admin.sql — admin panel support: suspension flag, support
-- tickets, content reports and an admin audit log.
-- NOTE: not yet applied to the live Supabase project "izzy". Run it in
-- the SQL editor before relying on the new columns/tables.
-- Additive and safe: existing shops get suspended = false, existing
-- contact messages become open tickets. Written for Step 06 (admin
-- panel, support, moderation).

-- Business suspension (Step 06 §3): enforced by the public-page server
-- function, which renders suspended shops as unavailable.
alter table public.profiles add column if not exists suspended boolean not null default false;

-- contact_messages becomes the support inbox. The public /contact form
-- keeps working unchanged (email + message only); the new columns carry
-- the ticket workflow (status/category/subject), the sender's account
-- when they were signed in, and an internal note that is only ever read
-- through admin server functions — never shown to customers.
alter table public.contact_messages add column if not exists status text not null default 'open';
alter table public.contact_messages add column if not exists category text;
alter table public.contact_messages add column if not exists subject text;
alter table public.contact_messages add column if not exists admin_note text;
alter table public.contact_messages add column if not exists user_id uuid;

-- Visitor reports about a shop (Step 06 §7). Submitted only through a
-- server function; nothing is ever auto-deleted from a report.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  target_username text not null,
  link_id uuid null references public.links(id) on delete set null,
  reason text not null,
  details text,
  reporter_email text,
  status text not null default 'open'
);

-- Every sensitive admin action lands here, written by the same server
-- function that performs the action (who, what, target, reason, when).
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_email text not null,
  action text not null,
  target_user_id uuid,
  target_username text,
  reason text,
  details jsonb
);

-- Both new tables are service-role only: RLS is on and there are
-- deliberately NO policies for anon or authenticated, so nothing can
-- read or write them from the browser. All access goes through admin
-- server functions that check the ADMIN_EMAILS allowlist first.
alter table public.reports enable row level security;
alter table public.admin_audit_log enable row level security;

create index if not exists reports_status_created_idx on public.reports (status, created_at);
create index if not exists contact_messages_status_created_idx on public.contact_messages (status, created_at);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at);
