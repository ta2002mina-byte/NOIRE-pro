-- =====================================================================
-- NOIRÉ — Phase 16: Customer avatar uploads
-- Lets a signed-in customer upload their own profile photo into the
-- existing "media" bucket, under avatars/<their own user id>/... only.
-- Builds on 20260929000100_noire_05_storage.sql (bucket + staff policies,
-- including public read — a profile photo is not private). Safe to run
-- again.
-- =====================================================================

drop policy if exists media_own_avatar_insert on storage.objects;
create policy media_own_avatar_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

drop policy if exists media_own_avatar_update on storage.objects;
create policy media_own_avatar_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

drop policy if exists media_own_avatar_delete on storage.objects;
create policy media_own_avatar_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
