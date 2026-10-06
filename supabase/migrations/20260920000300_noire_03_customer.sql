-- =====================================================================
-- NOIRÉ · Phase 1 · Migration 3 of 3 — Reservations & customer data
-- reservations, reservation_preferences, dining_history, dining_journal,
-- dining_passports, passport_milestones, taste_profiles, favorites,
-- reviews, notifications.
--
-- Idempotent. Customer data is private by RLS; anything that must not be
-- client-manipulable (verified visits, passport, milestones, review
-- status, verified-visit flag) is writable only by staff / server.
-- =====================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- reservations
-- Double-booking is impossible at the database level: the exclusion
-- constraint rejects any overlapping pending/confirmed booking of the
-- same table, even under concurrent requests.
-- ---------------------------------------------------------------------
create table if not exists public.reservations (
  id               uuid primary key default gen_random_uuid(),
  restaurant_id    uuid not null references public.restaurants (id) on delete cascade,
  customer_id      uuid references public.profiles (id) on delete set null,
  table_id         uuid references public.tables (id) on delete set null,
  reservation_date date not null,
  reservation_time time not null,
  -- Filled from restaurants.reservation_duration_minutes when omitted.
  duration_minutes integer not null check (duration_minutes between 30 and 480),
  guest_count      smallint not null check (guest_count between 1 and 100),
  experience_id    uuid references public.dining_experiences (id) on delete set null,
  occasion         text check (occasion in ('birthday', 'anniversary', 'proposal', 'graduation', 'other')),
  special_request  text check (special_request is null or length(special_request) <= 1000),
  -- Contact details for walk-ins / staff-created bookings (nullable).
  contact_name     text,
  contact_phone    text,
  contact_email    text,
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint reservations_no_double_booking exclude using gist (
    table_id with =,
    tsrange(
      reservation_date + reservation_time,
      reservation_date + reservation_time + make_interval(mins => duration_minutes)
    ) with &&
  ) where (table_id is not null and status in ('pending', 'confirmed'))
);
create index if not exists reservations_customer_idx   on public.reservations (customer_id, reservation_date desc);
create index if not exists reservations_day_idx        on public.reservations (restaurant_id, reservation_date, reservation_time);
create index if not exists reservations_table_idx      on public.reservations (table_id);
create index if not exists reservations_experience_idx on public.reservations (experience_id);
create index if not exists reservations_status_idx     on public.reservations (restaurant_id, status);
-- A customer cannot hold two live reservations at the same date+time.
create unique index if not exists reservations_customer_slot_uniq
  on public.reservations (customer_id, reservation_date, reservation_time)
  where customer_id is not null and status in ('pending', 'confirmed');

create table if not exists public.reservation_preferences (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  preference     text not null check (preference in ('window_seat', 'quiet', 'outdoor', 'birthday_setup')),
  created_at     timestamptz not null default now(),
  unique (reservation_id, preference)
);

-- Business rules that cannot be expressed as a CHECK (they look at other tables).
create or replace function public.validate_reservation()
returns trigger
language plpgsql
as $$
declare
  t   public.tables%rowtype;
  e   public.dining_experiences%rowtype;
  dur integer;
  relevant_change boolean;
begin
  if new.duration_minutes is null then
    select r.reservation_duration_minutes into dur
    from public.restaurants r where r.id = new.restaurant_id;
    new.duration_minutes := coalesce(dur, 120);
  end if;

  relevant_change := tg_op = 'INSERT'
    or new.table_id      is distinct from old.table_id
    or new.guest_count   is distinct from old.guest_count
    or new.experience_id is distinct from old.experience_id;

  if not relevant_change then
    return new;
  end if;

  if new.table_id is not null and new.status in ('pending', 'confirmed') then
    select * into t from public.tables where id = new.table_id;
    if t.restaurant_id is distinct from new.restaurant_id then
      raise exception 'Table does not belong to this restaurant' using errcode = '23514';
    end if;
    if not t.is_active then
      raise exception 'Table is not available' using errcode = '23514';
    end if;
    if new.guest_count < t.min_capacity or new.guest_count > t.capacity then
      raise exception 'Guest count does not fit this table' using errcode = '23514';
    end if;
  end if;

  if new.experience_id is not null then
    select * into e from public.dining_experiences where id = new.experience_id;
    if e.restaurant_id is distinct from new.restaurant_id then
      raise exception 'Experience does not belong to this restaurant' using errcode = '23514';
    end if;
    if not e.is_active and (tg_op = 'INSERT' or new.experience_id is distinct from old.experience_id) then
      raise exception 'This experience is not currently available' using errcode = '23514';
    end if;
    if e.min_guests is not null and new.guest_count < e.min_guests then
      raise exception 'Too few guests for this experience' using errcode = '23514';
    end if;
    if e.max_guests is not null and new.guest_count > e.max_guests then
      raise exception 'Too many guests for this experience' using errcode = '23514';
    end if;
    if new.table_id is not null
       and cardinality(e.available_areas) > 0
       and t.area is not null
       and not (t.area = any (e.available_areas)) then
      raise exception 'This table area is not offered for this experience' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- Signed-in customers can only cancel their own live reservation or edit
-- the special request. Everything else goes through staff / the server.
create or replace function public.guard_reservation_customer_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'special_request', 'updated_at'])
       is distinct from (to_jsonb(old) - array['status', 'special_request', 'updated_at']) then
    raise exception 'You can only cancel a reservation or update its special request'
      using errcode = '42501';
  end if;
  if old.status not in ('pending', 'confirmed') then
    raise exception 'This reservation can no longer be changed' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and new.status <> 'cancelled' then
    raise exception 'Customers can only cancel a reservation' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_validate on public.reservations;
create trigger reservations_validate
  before insert or update on public.reservations
  for each row execute function public.validate_reservation();

drop trigger if exists reservations_guard_customer on public.reservations;
create trigger reservations_guard_customer
  before update on public.reservations
  for each row execute function public.guard_reservation_customer_update();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- Which tables are taken for a slot. Returns ids only (no customer data),
-- so the public floor plan can grey them out despite reservation RLS.
-- This is a convenience for display; the exclusion constraint above is the
-- real guarantee, and the server must still re-check at confirmation.
create or replace function public.reserved_table_ids(
  p_restaurant_id    uuid,
  p_date             date,
  p_time             time,
  p_duration_minutes integer default null
)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct r.table_id
  from public.reservations r
  where r.restaurant_id = p_restaurant_id
    and r.table_id is not null
    and r.status in ('pending', 'confirmed')
    and tsrange(
          r.reservation_date + r.reservation_time,
          r.reservation_date + r.reservation_time + make_interval(mins => r.duration_minutes)
        ) && tsrange(
          p_date + p_time,
          p_date + p_time + make_interval(mins => coalesce(
            p_duration_minutes,
            (select rs.reservation_duration_minutes from public.restaurants rs where rs.id = p_restaurant_id),
            120
          ))
        );
$$;

revoke all on function public.reserved_table_ids(uuid, date, time, integer) from public;
grant execute on function public.reserved_table_ids(uuid, date, time, integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- dining_history  (VERIFIED visits — created only when a reservation is
-- marked completed by staff/server; customers can never write here)
-- ---------------------------------------------------------------------
create table if not exists public.dining_history (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.profiles (id) on delete cascade,
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  reservation_id uuid unique references public.reservations (id) on delete set null,
  experience_id  uuid references public.dining_experiences (id) on delete set null,
  visit_date     date not null,
  guest_count    smallint check (guest_count >= 1),
  created_at     timestamptz not null default now()
);
create index if not exists dining_history_customer_idx on public.dining_history (customer_id, visit_date desc);
create index if not exists dining_history_restaurant_idx on public.dining_history (restaurant_id, visit_date);

create or replace function public.sync_dining_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and new.customer_id is not null then
    insert into public.dining_history (customer_id, restaurant_id, reservation_id, experience_id, visit_date, guest_count)
    values (new.customer_id, new.restaurant_id, new.id, new.experience_id, new.reservation_date, new.guest_count)
    on conflict (reservation_id) do nothing;
  elsif tg_op = 'UPDATE' and old.status = 'completed' and new.status <> 'completed' then
    -- Status corrected by staff: the visit is no longer verified.
    delete from public.dining_history where reservation_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_dining_history() from public, anon, authenticated;

drop trigger if exists reservations_sync_dining_history on public.reservations;
create trigger reservations_sync_dining_history
  after insert or update of status on public.reservations
  for each row execute function public.sync_dining_history();

-- ---------------------------------------------------------------------
-- dining_journal  (private notes; only the owner can read or write)
-- order_id has no foreign key: NOIRÉ has no orders table yet.
-- ---------------------------------------------------------------------
create table if not exists public.dining_journal (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.profiles (id) on delete cascade,
  menu_item_id      uuid references public.menu_items (id) on delete set null,
  order_id          uuid,
  dining_history_id uuid references public.dining_history (id) on delete set null,
  personal_note     text check (personal_note is null or length(personal_note) <= 4000),
  rating            smallint check (rating between 1 and 5),
  visited_at        date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists dining_journal_customer_idx  on public.dining_journal (customer_id, visited_at desc);
create index if not exists dining_journal_menu_item_idx on public.dining_journal (menu_item_id);

drop trigger if exists dining_journal_set_updated_at on public.dining_journal;
create trigger dining_journal_set_updated_at
  before update on public.dining_journal
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- dining_passports / passport_milestones  (server-derived, read-only to
-- customers). Milestone RULES live in server code (Phase 9); this table
-- records what was awarded, at most once per customer per milestone.
-- ---------------------------------------------------------------------
create table if not exists public.dining_passports (
  id                         uuid primary key default gen_random_uuid(),
  customer_id                uuid not null unique references public.profiles (id) on delete cascade,
  visits_count               integer not null default 0 check (visits_count >= 0),
  dishes_explored_count      integer not null default 0 check (dishes_explored_count >= 0),
  experiences_completed_count integer not null default 0 check (experiences_completed_count >= 0),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create table if not exists public.passport_milestones (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.dining_passports (customer_id) on delete cascade,
  milestone_key text not null check (milestone_key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  awarded_at    timestamptz not null default now(),
  metadata      jsonb,
  unique (customer_id, milestone_key)
);

drop trigger if exists dining_passports_set_updated_at on public.dining_passports;
create trigger dining_passports_set_updated_at
  before update on public.dining_passports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- taste_profiles / favorites
-- ---------------------------------------------------------------------
create table if not exists public.taste_profiles (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid not null unique references public.profiles (id) on delete cascade,
  preferred_moods      text[] not null default '{}',
  spice_preference     smallint check (spice_preference between 0 and 5),
  flavor_preferences   text[] not null default '{}',
  texture_preferences  text[] not null default '{}',
  dietary_preferences  text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists taste_profiles_set_updated_at on public.taste_profiles;
create trigger taste_profiles_set_updated_at
  before update on public.taste_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.favorites (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.profiles (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (customer_id, menu_item_id)
);
create index if not exists favorites_menu_item_idx on public.favorites (menu_item_id);

-- ---------------------------------------------------------------------
-- reviews  (restaurant-level when menu_item_id is null, else per dish)
-- Reviews start 'pending'; only staff can publish. is_verified_visit is
-- computed by the database from dining_history, never from the client.
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.profiles (id) on delete cascade,
  restaurant_id     uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id      uuid references public.menu_items (id) on delete cascade,
  rating            smallint not null check (rating between 1 and 5),
  title             text check (title is null or length(title) <= 200),
  body              text check (body is null or length(body) <= 4000),
  status            text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  is_verified_visit boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists reviews_one_per_dish_uniq
  on public.reviews (customer_id, menu_item_id) where menu_item_id is not null;
create unique index if not exists reviews_one_per_restaurant_uniq
  on public.reviews (customer_id, restaurant_id) where menu_item_id is null;
create index if not exists reviews_public_idx on public.reviews (restaurant_id, status, created_at desc);
create index if not exists reviews_menu_item_idx on public.reviews (menu_item_id) where status = 'published';

create or replace function public.review_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Customers can never publish their own review. Server / staff contexts may set status.
  if auth.uid() is not null and not public.is_staff() then
    new.status := 'pending';
  end if;
  new.is_verified_visit := exists (
    select 1 from public.dining_history h
    where h.customer_id = new.customer_id and h.restaurant_id = new.restaurant_id
  );
  return new;
end;
$$;

drop trigger if exists reviews_before_insert on public.reviews;
create trigger reviews_before_insert
  before insert on public.reviews
  for each row execute function public.review_before_insert();

drop trigger if exists reviews_guard_update on public.reviews;
create trigger reviews_guard_update
  before update on public.reviews
  for each row execute function public.guard_owner_update('rating', 'title', 'body');

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- notifications  (recipients may only mark their own as read)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (length(trim(type)) > 0),
  title       text not null check (length(trim(title)) > 0),
  body        text,
  link_url    text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_inbox_idx  on public.notifications (customer_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (customer_id) where read_at is null;

drop trigger if exists notifications_guard_update on public.notifications;
create trigger notifications_guard_update
  before update on public.notifications
  for each row execute function public.guard_owner_update('read_at');

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.reservations            enable row level security;
alter table public.reservation_preferences enable row level security;
alter table public.dining_history          enable row level security;
alter table public.dining_journal          enable row level security;
alter table public.dining_passports        enable row level security;
alter table public.passport_milestones     enable row level security;
alter table public.taste_profiles          enable row level security;
alter table public.favorites               enable row level security;
alter table public.reviews                 enable row level security;
alter table public.notifications           enable row level security;

-- reservations ---------------------------------------------------------
drop policy if exists reservations_select_own_or_staff on public.reservations;
create policy reservations_select_own_or_staff on public.reservations
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff());

drop policy if exists reservations_insert_own on public.reservations;
create policy reservations_insert_own on public.reservations
  for insert to authenticated
  with check (customer_id = (select auth.uid()) and status = 'pending');

drop policy if exists reservations_update_own on public.reservations;
create policy reservations_update_own on public.reservations
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

drop policy if exists reservations_staff_all on public.reservations;
create policy reservations_staff_all on public.reservations
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- reservation_preferences ---------------------------------------------
drop policy if exists reservation_preferences_select on public.reservation_preferences;
create policy reservation_preferences_select on public.reservation_preferences
  for select to authenticated
  using (
    public.is_staff() or exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.customer_id = (select auth.uid())
    )
  );

drop policy if exists reservation_preferences_write_own on public.reservation_preferences;
create policy reservation_preferences_write_own on public.reservation_preferences
  for all to authenticated
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.customer_id = (select auth.uid())
        and r.status in ('pending', 'confirmed')
    )
  )
  with check (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.customer_id = (select auth.uid())
        and r.status in ('pending', 'confirmed')
    )
  );

drop policy if exists reservation_preferences_staff_all on public.reservation_preferences;
create policy reservation_preferences_staff_all on public.reservation_preferences
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- dining_history (read own; write staff/server only) ------------------
drop policy if exists dining_history_select_own_or_staff on public.dining_history;
create policy dining_history_select_own_or_staff on public.dining_history
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff());

drop policy if exists dining_history_staff_write on public.dining_history;
create policy dining_history_staff_write on public.dining_history
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- dining_journal (owner only — not even staff) ------------------------
drop policy if exists dining_journal_select_own on public.dining_journal;
create policy dining_journal_select_own on public.dining_journal
  for select to authenticated using (customer_id = (select auth.uid()));

drop policy if exists dining_journal_insert_own on public.dining_journal;
create policy dining_journal_insert_own on public.dining_journal
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and (
      dining_history_id is null or exists (
        select 1 from public.dining_history h
        where h.id = dining_history_id and h.customer_id = (select auth.uid())
      )
    )
  );

drop policy if exists dining_journal_update_own on public.dining_journal;
create policy dining_journal_update_own on public.dining_journal
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (
    customer_id = (select auth.uid())
    and (
      dining_history_id is null or exists (
        select 1 from public.dining_history h
        where h.id = dining_history_id and h.customer_id = (select auth.uid())
      )
    )
  );

drop policy if exists dining_journal_delete_own on public.dining_journal;
create policy dining_journal_delete_own on public.dining_journal
  for delete to authenticated using (customer_id = (select auth.uid()));

-- passport (read own; write staff/server only) ------------------------
drop policy if exists dining_passports_select_own_or_staff on public.dining_passports;
create policy dining_passports_select_own_or_staff on public.dining_passports
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff());

drop policy if exists dining_passports_staff_write on public.dining_passports;
create policy dining_passports_staff_write on public.dining_passports
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists passport_milestones_select_own_or_staff on public.passport_milestones;
create policy passport_milestones_select_own_or_staff on public.passport_milestones
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_staff());

drop policy if exists passport_milestones_staff_write on public.passport_milestones;
create policy passport_milestones_staff_write on public.passport_milestones
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- taste_profiles / favorites (owner only) -----------------------------
drop policy if exists taste_profiles_own on public.taste_profiles;
create policy taste_profiles_own on public.taste_profiles
  for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select to authenticated using (customer_id = (select auth.uid()));

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
  for insert to authenticated with check (customer_id = (select auth.uid()));

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete to authenticated using (customer_id = (select auth.uid()));

-- reviews --------------------------------------------------------------
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select to anon, authenticated
  using (status = 'published' or customer_id = (select auth.uid()) or public.is_staff());

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (customer_id = (select auth.uid()));

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (customer_id = (select auth.uid()));

drop policy if exists reviews_staff_all on public.reviews;
create policy reviews_staff_all on public.reviews
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- notifications ---------------------------------------------------------
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (customer_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (customer_id = (select auth.uid()));

drop policy if exists notifications_staff_insert on public.notifications;
create policy notifications_staff_insert on public.notifications
  for insert to authenticated with check (public.is_staff());

-- ---------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------
revoke all on
  public.reservations, public.reservation_preferences, public.dining_history,
  public.dining_journal, public.dining_passports, public.passport_milestones,
  public.taste_profiles, public.favorites, public.reviews, public.notifications
from anon, authenticated;

grant select, insert, update, delete on
  public.reservations, public.reservation_preferences, public.dining_history,
  public.dining_journal, public.dining_passports, public.passport_milestones,
  public.taste_profiles, public.favorites, public.reviews, public.notifications
to authenticated;

grant select on public.reviews to anon;

grant all on
  public.reservations, public.reservation_preferences, public.dining_history,
  public.dining_journal, public.dining_passports, public.passport_milestones,
  public.taste_profiles, public.favorites, public.reviews, public.notifications
to service_role;
