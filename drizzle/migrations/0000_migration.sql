create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  theme text not null default 'light',
  socials jsonb not null default '{}'::jsonb,
  whatsapp text,
  upi_id text,
  created_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "public read profiles with username" on public.profiles for select to anon, authenticated using (username is not null or auth.uid() = id);
create policy "own insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active',
  current_period_end timestamptz,
  razorpay_subscription_id text,
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "own read sub" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

create or replace function public.is_pro(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.subscriptions where user_id = _uid and plan = 'pro' and status = 'active'
    and (current_period_end is null or current_period_end > now()));
$$;
grant execute on function public.is_pro(uuid) to anon, authenticated;

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  enabled boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.links(user_id, position);
grant select on public.links to anon;
grant select, insert, update, delete on public.links to authenticated;
grant all on public.links to service_role;
alter table public.links enable row level security;
create policy "public read enabled links" on public.links for select to anon, authenticated using (enabled or auth.uid() = user_id);
create policy "own insert links" on public.links for insert to authenticated with check (auth.uid() = user_id);
create policy "own update links" on public.links for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete links" on public.links for delete to authenticated using (auth.uid() = user_id);

create or replace function public.enforce_link_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pro(new.user_id) and (select count(*) from public.links where user_id = new.user_id) >= 5 then
    raise exception 'Free plan allows up to 5 links. Upgrade to Pro for unlimited links.';
  end if;
  return new;
end; $$;
create trigger links_limit before insert on public.links for each row execute function public.enforce_link_limit();

create table public.link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.links(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.link_clicks(profile_id, created_at);
grant insert on public.link_clicks to anon, authenticated;
grant select on public.link_clicks to authenticated;
grant all on public.link_clicks to service_role;
alter table public.link_clicks enable row level security;
create policy "anyone logs click" on public.link_clicks for insert to anon, authenticated
  with check (exists(select 1 from public.links l where l.id = link_id and l.user_id = profile_id and l.enabled));
create policy "own read clicks" on public.link_clicks for select to authenticated using (auth.uid() = profile_id);

create table public.page_views (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.page_views(profile_id, created_at);
grant insert on public.page_views to anon, authenticated;
grant select on public.page_views to authenticated;
grant all on public.page_views to service_role;
alter table public.page_views enable row level security;
create policy "anyone logs view" on public.page_views for insert to anon, authenticated
  with check (exists(select 1 from public.profiles p where p.id = profile_id and p.username is not null));
create policy "own read views" on public.page_views for select to authenticated using (auth.uid() = profile_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatar own upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar own update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar own delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);