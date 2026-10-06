-- =====================================================================
-- NOIRÉ — Phase 15: Media storage (admin image uploads)
-- Creates one public bucket ("media") for admin-uploaded images —
-- dishes, ingredients, chef notes, stories, experiences — and locks
-- writes to staff/admin via RLS on storage.objects. Public (anon) can
-- only read. Safe to run again.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists media_staff_insert on storage.objects;
create policy media_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists media_staff_update on storage.objects;
create policy media_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_staff())
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists media_staff_delete on storage.objects;
create policy media_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());
