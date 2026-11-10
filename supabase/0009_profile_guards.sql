-- 0009_profile_guards.sql — database-level guards on profiles.
-- NOTE: not yet applied to the live Supabase project "izzy". Run it in
-- the SQL editor before relying on the guards.
--
-- Two columns on profiles are platform-controlled, not owner-controlled:
--   * suspended — set only by admins (Step 06), through server
--     functions running as the service role.
--   * username — claimable exactly once (NULL -> value, during
--     onboarding); after that the shop link must never change, or
--     every link a seller has shared breaks.
-- Until now both were only protected by app code: the browser client
-- holds an authenticated session and profiles has an owner UPDATE
-- policy, so a hand-crafted request could flip either column. This
-- trigger closes that at the database level.
--
-- The service role (admin functions, the Razorpay webhook, manual
-- grants) may change anything. Everyone else — authenticated owners
-- and anon alike — may update all other columns freely (name, bio,
-- avatar, whatsapp, category, theme, socials, upi id), but changing
-- `suspended`, or changing `username` once it is set, raises.

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

  return new;
end;
$$;

drop trigger if exists guard_profile_columns on public.profiles;
create trigger guard_profile_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();
