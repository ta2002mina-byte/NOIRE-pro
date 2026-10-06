-- =====================================================================
-- NOIRÉ — Phase 18: Footer logo and footer background image
-- Both optional. Safe to run again.
-- =====================================================================
alter table public.site_content add column if not exists footer_logo_url  text;
alter table public.site_content add column if not exists footer_image_url text;
