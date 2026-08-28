# Supabase authentication setup

The game remains fully playable as a guest when Supabase is not configured. To enable real email sign-up and login on GitHub Pages:

1. Create a Supabase project and enable Email authentication.
2. Copy only the project URL and **public anon key** into `js/auth-config.js`. Never put a service-role key in this repository.
3. Create the profile table and Row Level Security policies below.
4. Add the GitHub Pages URL to the allowed redirect URLs in Supabase Auth.

```sql
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  records jsonb not null default '[]'::jsonb,
  custom_routes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;

create policy "read own profile"
on public.player_profiles for select
using (auth.uid() = user_id);

create policy "insert own profile"
on public.player_profiles for insert
with check (auth.uid() = user_id);

create policy "update own profile"
on public.player_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

On the first authenticated session, the client upserts existing local records and custom routes into the signed-in user's profile. Passwords are sent only to Supabase Auth and are never stored in localStorage.
