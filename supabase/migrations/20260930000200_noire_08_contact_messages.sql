-- =====================================================================
-- NOIRÉ — Phase 17: Contact messages
-- Messages sent from the public Contact form. Anyone (signed in or not) may
-- INSERT a message; nobody but staff/admin can read, update or delete them.
-- Safe to run again.
-- =====================================================================

create table if not exists public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 100),
  email         text not null check (char_length(email) between 3 and 254 and email like '%@%'),
  phone         text check (phone is null or char_length(phone) <= 40),
  subject       text check (subject is null or char_length(subject) <= 150),
  message       text not null check (char_length(btrim(message)) between 5 and 4000),
  status        text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists contact_messages_restaurant_status_idx
  on public.contact_messages (restaurant_id, status, created_at desc);

drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at before update on public.contact_messages
  for each row execute function public.set_updated_at();

alter table public.contact_messages enable row level security;

-- Public insert: only as a brand-new message (status is forced to 'new').
drop policy if exists contact_messages_public_insert on public.contact_messages;
create policy contact_messages_public_insert on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'new');

drop policy if exists contact_messages_staff_all on public.contact_messages;
create policy contact_messages_staff_all on public.contact_messages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
