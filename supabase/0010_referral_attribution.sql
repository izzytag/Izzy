-- 0010_referral_attribution.sql — referral attribution for profiles.
-- NOTE: not yet applied to the live Supabase project "izzy". Run it in
-- the SQL editor before relying on the profiles.referred_by column.
-- Additive and safe: existing rows get NULL (no referrer recorded),
-- and the extended guard below keeps every check from 0009 while
-- adding one for the new column.
-- Written for the referral system: a new account stores the profile
-- id of the shop whose link brought them. The value is resolved and
-- written server-side only (the attribution server function runs as
-- the service role); the browser client can never write it.

alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- Extend the 0009 guard: referred_by joins suspended and username as
-- a platform-controlled column. The service-role bypass is unchanged
-- (server-side attribution is the only legitimate writer); everyone
-- else may not change referred_by at all — including NULL -> value,
-- so a hand-crafted request cannot claim or rewrite an attribution.
-- The function is replaced wholesale, so the 0009 checks are repeated
-- here verbatim; dropping and recreating the trigger keeps exactly
-- one guard trigger on the table.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
as $$
begin
  -- Service role bypass: server-side admin/billing code is the only
  -- legitimate writer of the guarded columns. auth.role() reads the
  -- role from the request JWT; the raw-claims check is a fallback for
  -- PostgREST contexts where auth.role() is unavailable. Outside
  -- PostgREST (psql, migrations) neither is set, so the guards apply.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role' then
    return new;
  end if;

  if new.suspended is distinct from old.suspended then
    raise exception 'Only izzy support can change a shop''s suspension status.';
  end if;

  -- NULL -> value is the one-time onboarding claim and stays allowed;
  -- value -> anything else (including NULL) is rejected.
  if old.username is not null and new.username is distinct from old.username then
    raise exception 'Your shop username cannot be changed once it is set.';
  end if;

  -- referred_by is written only by the server-side attribution
  -- function (service role, bypassed above). Any other change —
  -- including setting it for the first time — is rejected.
  if new.referred_by is distinct from old.referred_by then
    raise exception 'Referral attribution is set by izzy, not by the shop owner.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_columns on public.profiles;
create trigger guard_profile_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();
