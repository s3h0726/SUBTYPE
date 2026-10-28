-- SUBTYPE account + personal cloud sync + community leaderboard.
-- Apply through Supabase SQL Editor. Public anon/publishable key only in web app.
create extension if not exists pgcrypto;

create table if not exists public.player_public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '철도러' check (char_length(nickname) between 2 and 24),
  created_at timestamptz not null default now()
);
alter table public.player_public_profiles enable row level security;
revoke all on public.player_public_profiles from anon,authenticated;
grant select on public.player_public_profiles to anon,authenticated;
grant insert (user_id,nickname) on public.player_public_profiles to authenticated;
grant update (user_id,nickname) on public.player_public_profiles to authenticated;
drop policy if exists "public players can read nicknames" on public.player_public_profiles;
create policy "public players can read nicknames" on public.player_public_profiles for select to anon,authenticated using (true);
drop policy if exists "players add their profile" on public.player_public_profiles;
create policy "players add their profile" on public.player_public_profiles for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "players edit their nickname" on public.player_public_profiles;
create policy "players edit their nickname" on public.player_public_profiles for update to authenticated
 using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Keep private records / custom routes separate from public nicknames.
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  records jsonb not null default '{}'::jsonb,
  custom_routes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.player_profiles alter column records set default '{}'::jsonb;
alter table public.player_profiles enable row level security;
revoke all on public.player_profiles from anon,authenticated;
grant select on public.player_profiles to authenticated;
grant insert (user_id,records,custom_routes,updated_at) on public.player_profiles to authenticated;
grant update (user_id,records,custom_routes,updated_at) on public.player_profiles to authenticated;
drop policy if exists "read own profile" on public.player_profiles;
drop policy if exists "insert own profile" on public.player_profiles;
drop policy if exists "update own profile" on public.player_profiles;
drop policy if exists "own cloud read" on public.player_profiles;
drop policy if exists "own cloud insert" on public.player_profiles;
drop policy if exists "own cloud update" on public.player_profiles;
create policy "own cloud read" on public.player_profiles for select to authenticated using (user_id=(select auth.uid()));
create policy "own cloud insert" on public.player_profiles for insert to authenticated with check (user_id=(select auth.uid()));
create policy "own cloud update" on public.player_profiles for update to authenticated
 using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

-- Existing ranking_runs installations retain their numeric primary key.
create table if not exists public.ranking_runs (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 run_uid uuid unique not null default gen_random_uuid(),
 route_id text not null,
 route_name text not null,
 service_key text not null default 'legacy',
 service_name text not null default '기존 기록 · 계통 미분류',
 country_id text not null check (country_id in ('jp','kr')),
 cpm integer not null check (cpm between 1 and 1200),
 accuracy numeric(5,2) not null check (accuracy between 50 and 100),
 elapsed_ms bigint not null check (elapsed_ms between 3000 and 7200000),
 completed integer not null default 0,
 route_integrity boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.ranking_runs add column if not exists run_uid uuid;
alter table public.ranking_runs add column if not exists service_key text not null default 'legacy';
alter table public.ranking_runs add column if not exists service_name text not null default '기존 기록 · 계통 미분류';
alter table public.ranking_runs add column if not exists completed integer not null default 0;
alter table public.ranking_runs add column if not exists route_integrity boolean not null default false;
update public.ranking_runs set run_uid=gen_random_uuid() where run_uid is null;
create unique index if not exists ranking_runs_run_uid_idx on public.ranking_runs(run_uid);
create index if not exists ranking_runs_best_idx on public.ranking_runs(cpm desc,accuracy desc,elapsed_ms);
create index if not exists ranking_runs_route_idx on public.ranking_runs(country_id,route_id,cpm desc);
create index if not exists ranking_runs_service_idx on public.ranking_runs(country_id,route_id,service_key,cpm desc);
create index if not exists ranking_runs_user_idx on public.ranking_runs(user_id,created_at desc);
alter table public.ranking_runs enable row level security;
revoke all on public.ranking_runs from anon,authenticated;
grant select on public.ranking_runs to anon,authenticated;
grant insert (user_id,run_uid,route_id,route_name,service_key,service_name,country_id,cpm,accuracy,elapsed_ms,completed,route_integrity)
 on public.ranking_runs to authenticated;
drop policy if exists "ranking public read" on public.ranking_runs;
drop policy if exists "ranking own insert" on public.ranking_runs;
create policy "ranking public read" on public.ranking_runs for select to anon,authenticated
 using (route_integrity is true and completed >= 2 and cpm between 1 and 1200 and accuracy between 50 and 100);
create policy "ranking own insert" on public.ranking_runs for insert to authenticated
 with check (user_id=(select auth.uid()) and route_integrity is true and completed >= 2
    and country_id in ('jp','kr') and cpm between 1 and 1200 and accuracy between 50 and 100
    and elapsed_ms between 3000 and 7200000 and length(route_id) between 1 and 140
    and length(route_name) between 1 and 150 and length(service_key) between 1 and 480 and length(service_name) between 1 and 250);
-- Users cannot UPDATE or DELETE ranking rows through the Data API.
-- This is basic data hygiene, not authoritative gameplay proof.

create or replace view public.ranking_best
 with (security_invoker = true) as
 select coalesce(p.nickname,'철도러') as nickname,r.route_id,r.route_name,r.country_id,
    r.cpm,r.accuracy,r.elapsed_ms,r.completed,r.created_at,r.service_key,r.service_name
 from (
   select distinct on (user_id,route_id,country_id,service_key) user_id,route_id,route_name,country_id,service_key,service_name,cpm,
      accuracy,elapsed_ms,completed,created_at
   from public.ranking_runs
   where route_integrity is true and completed>=2
   order by user_id,route_id,country_id,service_key,cpm desc,accuracy desc,elapsed_ms asc
 ) r
 left join public.player_public_profiles p on p.user_id=r.user_id;
revoke all on public.ranking_best from anon,authenticated;
grant select on public.ranking_best to anon,authenticated;

-- Optional nickname creation from Auth email signup; secure schema is not exposed.
create schema if not exists subtype_private;
revoke all on schema subtype_private from public,anon,authenticated;
create or replace function subtype_private.create_player_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare nick text;
begin
 nick:=left(coalesce(nullif(btrim(new.raw_user_meta_data->>'nickname'),''),'철도러'),24);
 if char_length(nick)<2 then nick:='철도러'; end if;
 insert into public.player_public_profiles(user_id,nickname) values(new.id,nick)
 on conflict (user_id) do nothing;
 return new;
end;
$$;
drop trigger if exists subtype_auth_created on auth.users;
create trigger subtype_auth_created after insert on auth.users
 for each row execute function subtype_private.create_player_profile();

-- New accounts and existing accounts can now sync their private records.
-- Public scores remain unverified client-submitted claims until server validation is added.
