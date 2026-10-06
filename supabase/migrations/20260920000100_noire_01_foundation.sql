-- =====================================================================
-- NOIRÉ · Phase 1 · Migration 1 of 3 — Foundation
-- Extensions, profiles, role helpers, shared trigger functions.
--
-- Safe to run more than once (idempotent). Only creates what is missing.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- profiles  (one row per auth user, created automatically on signup)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'customer'
              check (role in ('customer', 'staff', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role) where role <> 'customer';

-- ---------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Role helpers. SECURITY DEFINER so RLS policies can call them without
-- recursing into the profiles policies.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role in ('staff', 'admin') from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Generic guard: a signed-in NON-staff user may only change the listed
-- columns of a row. Staff, the service role and SQL-editor sessions
-- (auth.uid() is null) are unrestricted. Usage:
--   create trigger ... execute function public.guard_owner_update('col_a', 'col_b');
create or replace function public.guard_owner_update()
returns trigger
language plpgsql
as $$
declare
  allowed text[] := array_append(tg_argv, 'updated_at');
begin
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'You are not allowed to change these fields'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Nobody but an admin (or a trusted server context) can change a role.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- New auth user  ->  profile row.
-- The role is ALWAYS 'customer': raw_user_meta_data is user-controlled
-- and must never decide privileges.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that signed up before this migration.
insert into public.profiles (id, email, full_name)
select u.id, u.email, nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), '')
from auth.users u
on conflict (id) do nothing;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_owner_update('full_name', 'phone', 'avatar_url');

-- Admin-only role management (callable from the client by an admin, or
-- from a trusted server / SQL editor for the very first admin).
create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('customer', 'staff', 'admin') then
    raise exception 'Invalid role: %', p_role;
  end if;
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change roles' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_staff on public.profiles;
create policy profiles_select_own_or_staff on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert/delete policies: rows are created by the signup trigger and
-- removed by the auth.users cascade.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;
