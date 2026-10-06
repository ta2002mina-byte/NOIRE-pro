-- =====================================================================
-- NOIRÉ — Phase 16: Site content (hero, announcement banner, footer)
-- One row per restaurant, edited from /admin/content. Every text column is
-- optional: NULL / blank means "use the built-in default" in the app.
-- Public can read (this is all public-page copy); only staff/admin can write.
-- Safe to run again.
-- =====================================================================

create table if not exists public.site_content (
  id                   uuid primary key default gen_random_uuid(),
  restaurant_id        uuid not null unique references public.restaurants (id) on delete cascade,

  -- Hero (homepage)
  hero_image_url       text,
  hero_eyebrow         text,
  hero_heading         text,
  hero_subtext         text,
  hero_primary_label   text,
  hero_primary_href    text,
  hero_secondary_label text,
  hero_secondary_href  text,

  -- Announcement banner (top of every public page)
  banner_enabled       boolean not null default false,
  banner_message       text,
  banner_link_label    text,
  banner_link_href     text,
  banner_starts_at     timestamptz,
  banner_ends_at       timestamptz,

  -- Footer
  footer_tagline       text,
  footer_copyright     text,
  footer_instagram_url text,
  footer_facebook_url  text,
  footer_tiktok_url    text,
  footer_youtube_url   text,
  footer_x_url         text,
  footer_links         jsonb not null default '[]'::jsonb,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  check (banner_starts_at is null or banner_ends_at is null or banner_ends_at > banner_starts_at),
  check (jsonb_typeof(footer_links) = 'array')
);

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
  for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;

drop policy if exists site_content_staff_all on public.site_content;
create policy site_content_staff_all on public.site_content for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
  for select to anon, authenticated using (true);

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant all on public.site_content to service_role;
