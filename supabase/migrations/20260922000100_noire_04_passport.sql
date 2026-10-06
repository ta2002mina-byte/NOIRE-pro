-- =====================================================================
-- NOIRÉ · Phase 9 — Dining Passport
--
-- dining_passports / passport_milestones already exist (Phase 1 migration
-- 3). This migration adds the server-side logic that keeps them in sync:
--   - public.recalculate_dining_passport(customer_id) recomputes the three
--     counters from verified records and awards any newly-earned
--     milestones. It is idempotent: re-running it never double-counts and
--     never re-awards a milestone (the unique constraint on
--     passport_milestones plus "on conflict do nothing" guarantee that).
--   - Triggers call it automatically whenever the records it depends on
--     change (dining_history, dining_journal). Nothing client-side ever
--     writes to dining_passports or passport_milestones directly — RLS
--     already restricts both to staff/server (see Phase 1 migration 3).
--   - A one-time backfill runs the function for every customer who
--     already has verified visits, so existing data is consistent the
--     moment this migration applies.
-- =====================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- Milestone thresholds. Kept in one place so the rules are auditable;
-- mirrored (for display only) in lib/constants/passport.ts.
--   first_visit    — visits_count      >= 1
--   explorer       — dishes_explored   >= 5
--   food_lover     — visits_count      >= 5
--   noire_insider  — visits_count      >= 10 AND experiences_completed >= 1
-- ---------------------------------------------------------------------
create or replace function public.recalculate_dining_passport(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visits      integer;
  v_dishes      integer;
  v_experiences integer;
begin
  if p_customer_id is null then
    return;
  end if;

  -- Verified visits only: dining_history rows exist solely for completed
  -- reservations (see sync_dining_history), so a cancelled/no-show
  -- reservation never contributes here.
  select count(*) into v_visits
  from public.dining_history
  where customer_id = p_customer_id;

  -- A dish only counts once it's both been journalled AND tied to a
  -- verified visit (dining_history_id not null) — a journal entry the
  -- customer added for a visit that was later un-marked as completed
  -- stops counting automatically, since dining_history_id would then
  -- point at a row that no longer exists (set null on delete).
  select count(distinct menu_item_id) into v_dishes
  from public.dining_journal
  where customer_id = p_customer_id
    and dining_history_id is not null
    and menu_item_id is not null;

  select count(*) into v_experiences
  from public.dining_history
  where customer_id = p_customer_id
    and experience_id is not null;

  insert into public.dining_passports (customer_id, visits_count, dishes_explored_count, experiences_completed_count)
  values (p_customer_id, v_visits, v_dishes, v_experiences)
  on conflict (customer_id) do update
    set visits_count                 = excluded.visits_count,
        dishes_explored_count        = excluded.dishes_explored_count,
        experiences_completed_count  = excluded.experiences_completed_count,
        updated_at                   = now();

  if v_visits >= 1 then
    insert into public.passport_milestones (customer_id, milestone_key, metadata)
    values (p_customer_id, 'first_visit', jsonb_build_object('visits_count', v_visits))
    on conflict (customer_id, milestone_key) do nothing;
  end if;

  if v_dishes >= 5 then
    insert into public.passport_milestones (customer_id, milestone_key, metadata)
    values (p_customer_id, 'explorer', jsonb_build_object('dishes_explored_count', v_dishes))
    on conflict (customer_id, milestone_key) do nothing;
  end if;

  if v_visits >= 5 then
    insert into public.passport_milestones (customer_id, milestone_key, metadata)
    values (p_customer_id, 'food_lover', jsonb_build_object('visits_count', v_visits))
    on conflict (customer_id, milestone_key) do nothing;
  end if;

  if v_visits >= 10 and v_experiences >= 1 then
    insert into public.passport_milestones (customer_id, milestone_key, metadata)
    values (p_customer_id, 'noire_insider', jsonb_build_object('visits_count', v_visits, 'experiences_completed_count', v_experiences))
    on conflict (customer_id, milestone_key) do nothing;
  end if;

  -- Milestones are never revoked once earned, even if a later correction
  -- (e.g. staff un-marking a visit as completed) drops a count back below
  -- a threshold — the badge records that the guest DID reach it at some
  -- point, and passport_milestones.awarded_at is the historical proof.
end;
$$;

revoke all on function public.recalculate_dining_passport(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Triggers: recalc whenever a dependency changes. Each trigger targets
-- only the affected customer, so this stays cheap even with many rows.
-- ---------------------------------------------------------------------
create or replace function public.trigger_recalculate_passport_from_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_dining_passport(old.customer_id);
    return old;
  end if;
  perform public.recalculate_dining_passport(new.customer_id);
  if tg_op = 'UPDATE' and old.customer_id is distinct from new.customer_id then
    perform public.recalculate_dining_passport(old.customer_id);
  end if;
  return new;
end;
$$;
revoke all on function public.trigger_recalculate_passport_from_history() from public, anon, authenticated;

drop trigger if exists dining_history_recalculate_passport on public.dining_history;
create trigger dining_history_recalculate_passport
  after insert or update or delete on public.dining_history
  for each row execute function public.trigger_recalculate_passport_from_history();

create or replace function public.trigger_recalculate_passport_from_journal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_dining_passport(old.customer_id);
    return old;
  end if;
  perform public.recalculate_dining_passport(new.customer_id);
  if tg_op = 'UPDATE' and old.customer_id is distinct from new.customer_id then
    perform public.recalculate_dining_passport(old.customer_id);
  end if;
  return new;
end;
$$;
revoke all on function public.trigger_recalculate_passport_from_journal() from public, anon, authenticated;

drop trigger if exists dining_journal_recalculate_passport on public.dining_journal;
create trigger dining_journal_recalculate_passport
  after insert or update or delete on public.dining_journal
  for each row execute function public.trigger_recalculate_passport_from_journal();

-- ---------------------------------------------------------------------
-- Backfill: bring every customer with existing verified visits up to
-- date the moment this migration applies. Safe to re-run.
-- ---------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in select distinct customer_id from public.dining_history loop
    perform public.recalculate_dining_passport(c.customer_id);
  end loop;
end;
$$;
