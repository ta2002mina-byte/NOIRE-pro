-- Behaviour tests for the NOIRÉ Phase 1 schema (plain PostgreSQL + mock auth).
-- Run AFTER 00_local_supabase_mock.sql and the three migrations, e.g.:
--   psql -v ON_ERROR_STOP=1 -q -d noire_test -f supabase/tests/10_rls_and_rules_test.sql
-- Prints one line per check and a final PASS/FAIL summary.
set client_min_messages = warning;
create schema if not exists t;
drop table if exists t.results;
create table t.results (n serial, label text, ok boolean);
grant usage on schema t to public;

-- Run SQL as a given user/role. Returns 'ok' or 'err:<sqlstate>'.
create or replace function t.run(p_uid uuid, p_role text, p_sql text) returns text
language plpgsql as $$
declare v text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  execute format('set local role %I', p_role);
  begin execute p_sql; v := 'ok';
  exception when others then v := 'err:' || sqlstate; end;
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  return v;
end $$;

-- Count rows visible to a user.
create or replace function t.count(p_uid uuid, p_role text, p_sql text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  execute format('set local role %I', p_role);
  begin execute p_sql into n; exception when others then n := -1; end;
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  return n;
end $$;

create or replace function t.check(p_label text, p_ok boolean) returns void
language sql as $$ insert into t.results (label, ok) values (p_label, coalesce(p_ok, false)) $$;

-- ---------------- fixtures (superuser / trusted context) ----------------
truncate auth.users cascade;
truncate public.restaurants cascade;

insert into auth.users (id, email, raw_user_meta_data) values
 ('a0000000-0000-0000-0000-00000000000a', 'alice@example.com', '{"full_name":"Alice","role":"admin"}'),
 ('b0000000-0000-0000-0000-00000000000b', 'bob@example.com',   '{"full_name":"Bob"}'),
 ('c0000000-0000-0000-0000-00000000000c', 'staff@example.com', '{"full_name":"Staff"}');
select public.set_user_role('c0000000-0000-0000-0000-00000000000c', 'staff');

insert into public.restaurants (id, name, slug) values ('f0000000-0000-0000-0000-000000000001', 'Test Resto', 'test-resto');
insert into public.tables (id, restaurant_id, label, area, min_capacity, capacity) values
 ('e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'T1', 'window', 1, 4),
 ('e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'T2', 'garden', 2, 6);
insert into public.dining_experiences (id, restaurant_id, title, slug, min_guests, max_guests, available_areas, is_active) values
 ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Romantic', 'romantic', 2, 2, '{window,quiet}', true),
 ('d0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Retired',  'retired',  null, null, '{}', false);
insert into public.menu_items (id, restaurant_id, name, slug, price, is_available) values
 ('90000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Dish One', 'dish-one', 12.50, true),
 ('90000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Dish Two', 'dish-two', 9, false);

-- ---------------- profiles / roles ----------------
select t.check('signup trigger created 3 profiles', (select count(*) from public.profiles) = 3);
select t.check('metadata role="admin" ignored -> customer', (select role from public.profiles where email='alice@example.com') = 'customer');
select t.check('customer cannot change own role', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.profiles set role='admin' where id='b0000000-0000-0000-0000-00000000000b'$q$) like 'err:%');
select t.check('customer can update own name', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.profiles set full_name='Bobby' where id='b0000000-0000-0000-0000-00000000000b'$q$) = 'ok');
select t.check('customer sees only own profile', t.count('b0000000-0000-0000-0000-00000000000b','authenticated','select count(*) from public.profiles') = 1);
select t.check('staff sees all profiles', t.count('c0000000-0000-0000-0000-00000000000c','authenticated','select count(*) from public.profiles') = 3);
select t.check('staff cannot self-promote to admin', t.run('c0000000-0000-0000-0000-00000000000c','authenticated',
  $q$select public.set_user_role('c0000000-0000-0000-0000-00000000000c','admin')$q$) like 'err:%');
select t.check('anon cannot read profiles', t.count(null,'anon','select count(*) from public.profiles') = -1);

-- ---------------- public content ----------------
select t.check('anon reads restaurants', t.count(null,'anon','select count(*) from public.restaurants') = 1);
select t.check('anon reads unavailable dish too (flagged, not hidden)', t.count(null,'anon','select count(*) from public.menu_items') = 2);
select t.check('anon cannot insert menu item', t.run(null,'anon',
  $q$insert into public.menu_items (restaurant_id,name,slug,price) values ('f0000000-0000-0000-0000-000000000001','x','x',1)$q$) like 'err:%');
select t.check('customer cannot insert menu item', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.menu_items (restaurant_id,name,slug,price) values ('f0000000-0000-0000-0000-000000000001','x','x',1)$q$) like 'err:%');
select t.check('staff can insert menu item', t.run('c0000000-0000-0000-0000-00000000000c','authenticated',
  $q$insert into public.menu_items (restaurant_id,name,slug,price) values ('f0000000-0000-0000-0000-000000000001','Staff dish','staff-dish',5)$q$) = 'ok');
select t.check('negative price rejected', t.run(null,'service_role',
  $q$insert into public.menu_items (restaurant_id,name,slug,price) values ('f0000000-0000-0000-0000-000000000001','neg','neg',-1)$q$) like 'err:%');
select t.check('bad slug rejected', t.run(null,'service_role',
  $q$insert into public.menu_items (restaurant_id,name,slug,price) values ('f0000000-0000-0000-0000-000000000001','bad','Bad Slug!',1)$q$) like 'err:%');
select t.check('duplicate slug per restaurant rejected', t.run(null,'service_role',
  $q$insert into public.menu_items (restaurant_id,name,slug,price) values ('f0000000-0000-0000-0000-000000000001','dup','dish-one',1)$q$) like 'err:%');

-- ingredient sources are hidden until published
insert into public.ingredients (id, restaurant_id, name, slug) values ('80000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','Tomato','tomato');
insert into public.ingredient_sources (ingredient_id, source_name, is_published) values
 ('80000000-0000-0000-0000-000000000001','Unpublished source', false),
 ('80000000-0000-0000-0000-000000000001','Published source', true);
select t.check('anon sees only published ingredient sources', t.count(null,'anon','select count(*) from public.ingredient_sources') = 1);

-- stories / chef notes visibility
insert into public.restaurant_stories (restaurant_id, title, published_at, expires_at, is_active) values
 ('f0000000-0000-0000-0000-000000000001','live',      now() - interval '1 hour', now() + interval '1 hour', true),
 ('f0000000-0000-0000-0000-000000000001','expired',   now() - interval '3 hour', now() - interval '1 hour', true),
 ('f0000000-0000-0000-0000-000000000001','future',    now() + interval '1 hour', null, true),
 ('f0000000-0000-0000-0000-000000000001','inactive',  now() - interval '1 hour', null, false),
 ('f0000000-0000-0000-0000-000000000001','unpublished', null, null, true);
select t.check('only the live story is public', t.count(null,'anon','select count(*) from public.restaurant_stories') = 1);
insert into public.chef_notes (restaurant_id, title, body, status, publish_at) values
 ('f0000000-0000-0000-0000-000000000001','draft','b','draft',null),
 ('f0000000-0000-0000-0000-000000000001','pub','b','published',null),
 ('f0000000-0000-0000-0000-000000000001','sched-past','b','scheduled', now() - interval '1 hour'),
 ('f0000000-0000-0000-0000-000000000001','sched-future','b','scheduled', now() + interval '1 hour'),
 ('f0000000-0000-0000-0000-000000000001','archived','b','archived',null);
select t.check('chef notes: published + due-scheduled are public (2)', t.count(null,'anon','select count(*) from public.chef_notes') = 2);
select t.check('scheduled note requires publish_at', t.run(null,'service_role',
  $q$insert into public.chef_notes (restaurant_id,title,body,status) values ('f0000000-0000-0000-0000-000000000001','x','b','scheduled')$q$) like 'err:%');

-- ---------------- reservations ----------------
select t.check('customer can create own pending reservation', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reservations (id,restaurant_id,customer_id,table_id,reservation_date,reservation_time,guest_count)
     values ('10000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','e0000000-0000-0000-0000-000000000001','2030-01-10','19:00',2)$q$) = 'ok');
select t.check('duration defaulted from restaurant (120)', (select duration_minutes from public.reservations where id='10000000-0000-0000-0000-000000000001') = 120);
select t.check('customer cannot insert as confirmed', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,reservation_date,reservation_time,guest_count,status)
     values ('f0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','2030-02-10','19:00',2,'confirmed')$q$) like 'err:%');
select t.check('customer cannot book for someone else', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,reservation_date,reservation_time,guest_count)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','2030-02-11','19:00',2)$q$) like 'err:%');
select t.check('overlapping booking of same table rejected (double booking)', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,table_id,reservation_date,reservation_time,guest_count)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','e0000000-0000-0000-0000-000000000001','2030-01-10','20:30',2)$q$) like 'err:23P01');
select t.check('non-overlapping later slot allowed', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,table_id,reservation_date,reservation_time,guest_count)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','e0000000-0000-0000-0000-000000000001','2030-01-10','21:00',2)$q$) = 'ok');
select t.check('different table same time allowed', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,table_id,reservation_date,reservation_time,guest_count)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','e0000000-0000-0000-0000-000000000002','2030-01-10','19:00',3)$q$) = 'ok');
select t.check('guest count over table capacity rejected', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,table_id,reservation_date,reservation_time,guest_count)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','e0000000-0000-0000-0000-000000000001','2030-03-01','19:00',9)$q$) like 'err:%');
select t.check('inactive experience rejected', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,reservation_date,reservation_time,guest_count,experience_id)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','2030-03-02','19:00',2,'d0000000-0000-0000-0000-000000000002')$q$) like 'err:%');
select t.check('experience guest range enforced (romantic = 2)', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,reservation_date,reservation_time,guest_count,experience_id)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','2030-03-03','19:00',4,'d0000000-0000-0000-0000-000000000001')$q$) like 'err:%');
select t.check('experience area enforced (garden table not allowed)', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,table_id,reservation_date,reservation_time,guest_count,experience_id)
     values ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','e0000000-0000-0000-0000-000000000002','2030-03-04','19:00',2,'d0000000-0000-0000-0000-000000000001')$q$) like 'err:%');
select t.check('same customer cannot hold two live reservations at same slot', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reservations (restaurant_id,customer_id,reservation_date,reservation_time,guest_count)
     values ('f0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','2030-01-10','19:00',2)$q$) like 'err:23505');
select t.check('customer sees only own reservations', t.count('b0000000-0000-0000-0000-00000000000b','authenticated','select count(*) from public.reservations') = 1);
select t.check('staff sees all reservations', t.count('c0000000-0000-0000-0000-00000000000c','authenticated','select count(*) from public.reservations') = 3);
select t.check('reserved_table_ids exposes taken table only', (select count(*) from public.reserved_table_ids('f0000000-0000-0000-0000-000000000001','2030-01-10','19:30')) = 2);
select t.check('reserved_table_ids callable by anon', t.count(null,'anon',$q$select count(*) from public.reserved_table_ids('f0000000-0000-0000-0000-000000000001','2030-01-10','19:30')$q$) = 2);
select t.check('customer cannot change guest_count', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reservations set guest_count=3 where id='10000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('customer cannot self-confirm', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reservations set status='confirmed' where id='10000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('customer cannot mark own reservation completed', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reservations set status='completed' where id='10000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('customer cannot touch another customer''s reservation', t.count('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$with u as (update public.reservations set special_request='hacked' where id='10000000-0000-0000-0000-000000000001' returning 1) select count(*) from u$q$) = 0);
select t.check('customer can edit special request', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reservations set special_request='Window please' where id='10000000-0000-0000-0000-000000000001'$q$) = 'ok');
select t.check('customer can add preference to own reservation', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reservation_preferences (reservation_id,preference) values ('10000000-0000-0000-0000-000000000001','window_seat')$q$) = 'ok');
select t.check('customer cannot add preference to others'' reservation', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reservation_preferences (reservation_id,preference) values ('10000000-0000-0000-0000-000000000001','quiet')$q$) like 'err:%');
select t.check('customer can cancel own reservation', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reservations set status='cancelled' where id='10000000-0000-0000-0000-000000000001'$q$) = 'ok');
select t.check('freed table can be booked by staff', t.run('c0000000-0000-0000-0000-00000000000c','authenticated',
  $q$insert into public.reservations (restaurant_id,table_id,reservation_date,reservation_time,guest_count,contact_name)
     values ('f0000000-0000-0000-0000-000000000001','e0000000-0000-0000-0000-000000000001','2030-01-10','19:00',2,'Walk-in')$q$) = 'ok');
select t.check('customer cannot edit a cancelled reservation', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reservations set special_request='again' where id='10000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('anon cannot read reservations', t.count(null,'anon','select count(*) from public.reservations') = -1);

-- ---------------- dining history (verified visits) ----------------
insert into public.reservations (id,restaurant_id,customer_id,reservation_date,reservation_time,guest_count,status)
values ('10000000-0000-0000-0000-000000000009','f0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','2029-12-01','19:00',2,'confirmed');
select t.check('no history before completion', (select count(*) from public.dining_history) = 0);
select t.check('staff completes reservation', t.run('c0000000-0000-0000-0000-00000000000c','authenticated',
  $q$update public.reservations set status='completed' where id='10000000-0000-0000-0000-000000000009'$q$) = 'ok');
select t.check('verified history row created once', (select count(*) from public.dining_history) = 1);
update public.reservations set status='completed', special_request='touch' where id='10000000-0000-0000-0000-000000000009';
select t.check('re-completing does not duplicate history', (select count(*) from public.dining_history) = 1);
select t.check('customer sees own history', t.count('b0000000-0000-0000-0000-00000000000b','authenticated','select count(*) from public.dining_history') = 1);
select t.check('other customer cannot see it', t.count('a0000000-0000-0000-0000-00000000000a','authenticated','select count(*) from public.dining_history') = 0);
select t.check('customer cannot forge history', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.dining_history (customer_id,restaurant_id,visit_date) values ('b0000000-0000-0000-0000-00000000000b','f0000000-0000-0000-0000-000000000001','2029-01-01')$q$) like 'err:%');
insert into public.reservations (id,restaurant_id,customer_id,reservation_date,reservation_time,guest_count,status)
values ('10000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000000a','2029-12-02','19:00',2,'no_show');
select t.check('no-show does not create history', (select count(*) from public.dining_history where customer_id='a0000000-0000-0000-0000-00000000000a') = 0);
update public.reservations set status='confirmed' where id='10000000-0000-0000-0000-000000000009';
select t.check('un-completing removes verified history', (select count(*) from public.dining_history) = 0);
update public.reservations set status='completed' where id='10000000-0000-0000-0000-000000000009';

-- ---------------- journal privacy ----------------
select t.check('customer writes own journal entry', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.dining_journal (id,customer_id,menu_item_id,personal_note,rating) values ('20000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','90000000-0000-0000-0000-000000000001','Loved it',5)$q$) = 'ok');
select t.check('cannot write journal as another customer', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.dining_journal (customer_id,personal_note) values ('a0000000-0000-0000-0000-00000000000a','spoof')$q$) like 'err:%');
select t.check('other customer cannot read journal', t.count('a0000000-0000-0000-0000-00000000000a','authenticated','select count(*) from public.dining_journal') = 0);
select t.check('staff cannot read customer journal', t.count('c0000000-0000-0000-0000-00000000000c','authenticated','select count(*) from public.dining_journal') = 0);
select t.check('other customer cannot edit journal', t.count('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$with u as (update public.dining_journal set personal_note='x' where id='20000000-0000-0000-0000-000000000001' returning 1) select count(*) from u$q$) = 0);
select t.check('other customer cannot delete journal', t.count('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$with d as (delete from public.dining_journal where id='20000000-0000-0000-0000-000000000001' returning 1) select count(*) from d$q$) = 0);
select t.check('rating 6 rejected', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.dining_journal set rating=6 where id='20000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('cannot link journal to someone else''s verified visit', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  format($q$insert into public.dining_journal (customer_id,dining_history_id) values ('a0000000-0000-0000-0000-00000000000a','%s')$q$, (select id from public.dining_history limit 1))) like 'err:%');
select t.check('can link journal to own verified visit', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  format($q$insert into public.dining_journal (customer_id,dining_history_id,personal_note) values ('b0000000-0000-0000-0000-00000000000b','%s','verified')$q$, (select id from public.dining_history limit 1))) = 'ok');
select t.check('owner can delete own entry', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$delete from public.dining_journal where id='20000000-0000-0000-0000-000000000001'$q$) = 'ok');

-- ---------------- passport ----------------
insert into public.dining_passports (customer_id, visits_count) values ('b0000000-0000-0000-0000-00000000000b', 1);
insert into public.passport_milestones (customer_id, milestone_key) values ('b0000000-0000-0000-0000-00000000000b','first_visit');
select t.check('customer reads own passport', t.count('b0000000-0000-0000-0000-00000000000b','authenticated','select count(*) from public.dining_passports') = 1);
select t.check('other customer cannot read passport', t.count('a0000000-0000-0000-0000-00000000000a','authenticated','select count(*) from public.dining_passports') = 0);
select t.check('customer cannot raise own visit count', t.count('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$with u as (update public.dining_passports set visits_count=99 returning 1) select count(*) from u$q$) = 0);
select t.check('customer cannot award self a milestone', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.passport_milestones (customer_id,milestone_key) values ('b0000000-0000-0000-0000-00000000000b','noire_insider')$q$) like 'err:%');
select t.check('customer cannot create passport', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.dining_passports (customer_id,visits_count) values ('a0000000-0000-0000-0000-00000000000a',50)$q$) like 'err:%');
select t.check('milestone cannot be awarded twice', t.run(null,'service_role',
  $q$insert into public.passport_milestones (customer_id,milestone_key) values ('b0000000-0000-0000-0000-00000000000b','first_visit')$q$) = 'err:23505');

-- ---------------- favorites / taste profile ----------------
select t.check('customer can favorite a dish', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.favorites (customer_id,menu_item_id) values ('b0000000-0000-0000-0000-00000000000b','90000000-0000-0000-0000-000000000001')$q$) = 'ok');
select t.check('duplicate favorite rejected', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.favorites (customer_id,menu_item_id) values ('b0000000-0000-0000-0000-00000000000b','90000000-0000-0000-0000-000000000001')$q$) = 'err:23505');
select t.check('cannot favorite as someone else', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.favorites (customer_id,menu_item_id) values ('a0000000-0000-0000-0000-00000000000a','90000000-0000-0000-0000-000000000001')$q$) like 'err:%');
select t.check('favorites are private', t.count('a0000000-0000-0000-0000-00000000000a','authenticated','select count(*) from public.favorites') = 0);
select t.check('customer saves own taste profile', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.taste_profiles (customer_id,preferred_moods,spice_preference) values ('b0000000-0000-0000-0000-00000000000b','{light}',3)$q$) = 'ok');
select t.check('taste profile is private', t.count('a0000000-0000-0000-0000-00000000000a','authenticated','select count(*) from public.taste_profiles') = 0);

-- ---------------- reviews ----------------
select t.check('customer submits review; forced pending even if published requested', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reviews (id,customer_id,restaurant_id,menu_item_id,rating,status,is_verified_visit)
     values ('30000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b','f0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',5,'published',true)$q$) = 'ok');
select t.check('status was forced to pending', (select status from public.reviews where id='30000000-0000-0000-0000-000000000001') = 'pending');
select t.check('verified flag computed by DB (has completed visit)', (select is_verified_visit from public.reviews where id='30000000-0000-0000-0000-000000000001') = true);
select t.check('unverified reviewer can submit review', t.run('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$insert into public.reviews (id,customer_id,restaurant_id,rating,is_verified_visit) values ('30000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-00000000000a','f0000000-0000-0000-0000-000000000001',4,true)$q$) = 'ok');
select t.check('...and is flagged unverified by the DB', (select is_verified_visit from public.reviews where id='30000000-0000-0000-0000-000000000002') = false);
select t.check('anon cannot see pending reviews', t.count(null,'anon','select count(*) from public.reviews') = 0);
select t.check('customer cannot publish own review', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reviews set status='published' where id='30000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('customer can edit own review text', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reviews set body='Great' where id='30000000-0000-0000-0000-000000000001'$q$) = 'ok');
select t.check('customer cannot flip verified flag', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.reviews set is_verified_visit=false where id='30000000-0000-0000-0000-000000000001'$q$) like 'err:%');
select t.check('other customer cannot edit review', t.count('a0000000-0000-0000-0000-00000000000a','authenticated',
  $q$with u as (update public.reviews set body='x' where id='30000000-0000-0000-0000-000000000001' returning 1) select count(*) from u$q$) = 0);
select t.check('duplicate dish review rejected', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.reviews (customer_id,restaurant_id,menu_item_id,rating) values ('b0000000-0000-0000-0000-00000000000b','f0000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',3)$q$) = 'err:23505');
select t.check('staff can publish', t.run('c0000000-0000-0000-0000-00000000000c','authenticated',
  $q$update public.reviews set status='published' where id='30000000-0000-0000-0000-000000000001'$q$) = 'ok');
select t.check('anon now sees the published review only', t.count(null,'anon','select count(*) from public.reviews') = 1);

-- ---------------- notifications ----------------
insert into public.notifications (customer_id, type, title) values ('b0000000-0000-0000-0000-00000000000b','reservation','Confirmed');
select t.check('customer reads own notification', t.count('b0000000-0000-0000-0000-00000000000b','authenticated','select count(*) from public.notifications') = 1);
select t.check('other customer cannot read it', t.count('a0000000-0000-0000-0000-00000000000a','authenticated','select count(*) from public.notifications') = 0);
select t.check('customer can mark read', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.notifications set read_at=now()$q$) = 'ok');
select t.check('customer cannot rewrite notification text', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$update public.notifications set title='pwned'$q$) like 'err:%');
select t.check('customer cannot send notifications', t.run('b0000000-0000-0000-0000-00000000000b','authenticated',
  $q$insert into public.notifications (customer_id,type,title) values ('a0000000-0000-0000-0000-00000000000a','x','y')$q$) like 'err:%');

-- ---------------- account deletion cascade ----------------
delete from auth.users where id = 'b0000000-0000-0000-0000-00000000000b';
select t.check('deleting a user removes private data, keeps reservation history row anonymised',
  (select count(*) from public.dining_journal) = 0
  and (select count(*) from public.favorites) = 0
  and (select count(*) from public.dining_history) = 0
  and (select count(*) from public.reservations where id='10000000-0000-0000-0000-000000000009' and customer_id is null) = 1);

-- ---------------- summary ----------------
select case when ok then 'PASS' else '** FAIL **' end as result, label from t.results order by n;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from t.results;
