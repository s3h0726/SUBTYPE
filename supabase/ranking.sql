-- Run in Supabase SQL Editor after configuring js/auth-config.js with PUBLIC project URL and anon key.
create table if not exists public.ranking_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id text not null,
  route_name text not null,
  country_id text not null check(country_id in ('jp','kr')),
  cpm integer not null check (cpm between 0 and 2000),
  accuracy numeric(5,2) not null check (accuracy between 0 and 100),
  elapsed_ms bigint not null check (elapsed_ms > 0),
  created_at timestamptz not null default now()
);
create index if not exists ranking_runs_cpm_idx on public.ranking_runs(cpm desc,accuracy desc);
create index if not exists ranking_runs_user_idx on public.ranking_runs(user_id,created_at desc);
alter table public.ranking_runs enable row level security;
drop policy if exists "ranking public read" on public.ranking_runs;
create policy "ranking public read" on public.ranking_runs for select to anon,authenticated using(true);
drop policy if exists "ranking own insert" on public.ranking_runs;
create policy "ranking own insert" on public.ranking_runs for insert to authenticated with check(user_id=auth.uid());
-- Client-submitted typing scores are unverified. Competitive leaderboard needs server-side validation.
