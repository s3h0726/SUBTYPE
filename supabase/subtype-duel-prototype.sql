-- SUBTYPE friendly realtime duel prototype, REVIEW/TEST PROJECT ONLY.
-- DO NOT apply in production until security review and two-user QA.
-- No ranking writes. Room UUID serves as an unguessable invite identifier.
create extension if not exists pgcrypto;
create table if not exists public.subtype_duel_rooms (
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null references auth.users(id) on delete cascade,
 guest_id uuid references auth.users(id) on delete set null,
 route_id text not null check (length(route_id) between 1 and 140),
 service_key text not null check (length(service_key) between 1 and 480),
 status text not null default 'waiting' check (status in ('waiting','running','finished')),
 created_at timestamptz not null default now(),
 constraint subtype_duel_different_players check (guest_id is null or guest_id <> host_id)
);
create index if not exists subtype_duel_host_idx on public.subtype_duel_rooms(host_id);
create index if not exists subtype_duel_guest_idx on public.subtype_duel_rooms(guest_id);
alter table public.subtype_duel_rooms enable row level security;
revoke all on public.subtype_duel_rooms from anon,authenticated;
grant select on public.subtype_duel_rooms to authenticated;
grant insert (host_id,route_id,service_key) on public.subtype_duel_rooms to authenticated;
drop policy if exists "subtype_duel_member_read" on public.subtype_duel_rooms;
create policy "subtype_duel_member_read" on public.subtype_duel_rooms
 for select to authenticated using (
 host_id=(select auth.uid()) or guest_id=(select auth.uid())
 );
drop policy if exists "subtype_duel_host_create" on public.subtype_duel_rooms;
create policy "subtype_duel_host_create" on public.subtype_duel_rooms
 for insert to authenticated with check (host_id=(select auth.uid()) and guest_id is null and status='waiting');
-- Atomic join with server-enforced 2-player limit; function runs with creator privileges.
create or replace function public.subtype_join_duel(p_room uuid)
returns boolean language plpgsql security definer
set search_path='' as $$
declare actor uuid; joined_room uuid;
begin
 actor := auth.uid();
 if actor is null then raise exception 'Authentication required'; end if;
 update public.subtype_duel_rooms
 set guest_id=actor
 where id=p_room and host_id<>actor and guest_id is null
   and status='waiting' and created_at>now()-interval '1 hour'
 returning id into joined_room;
 if joined_room is not null then return true; end if;
 return exists(select 1 from public.subtype_duel_rooms where id=p_room and guest_id=actor);
end; $$;
revoke all on function public.subtype_join_duel(uuid) from public,anon;
grant execute on function public.subtype_join_duel(uuid) to authenticated;
-- Realtime private channel topic: subtype-duel:<room_uuid>.
-- Supabase Realtime authorization is checked on subscribe; membership changes may require resubscribe.
drop policy if exists "subtype_duel_realtime_read" on realtime.messages;
create policy "subtype_duel_realtime_read" on realtime.messages
 for select to authenticated using (
 extension='broadcast'
 and exists (
   select 1 from public.subtype_duel_rooms r
   where (r.host_id=(select auth.uid()) or r.guest_id=(select auth.uid()))
     and (select realtime.topic())='subtype-duel:'||r.id::text
     and r.created_at>now()-interval '2 hours'
 )
 );
drop policy if exists "subtype_duel_realtime_write" on realtime.messages;
create policy "subtype_duel_realtime_write" on realtime.messages
 for insert to authenticated with check (
 extension='broadcast'
 and exists (
   select 1 from public.subtype_duel_rooms r
   where (r.host_id=(select auth.uid()) or r.guest_id=(select auth.uid()))
     and (select realtime.topic())='subtype-duel:'||r.id::text
     and r.created_at>now()-interval '2 hours'
 )
 );
-- IMPORTANT: Broadcast payload is client-supplied, not a server-verified score.
-- For rated matches use trusted authoritative gameplay validation, timeouts, replay protection and moderation.
