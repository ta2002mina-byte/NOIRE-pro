-- =====================================================================
-- NOIRÉ · Phase 1 · Migration 2 of 3 — Restaurant content
-- restaurants, categories, menu_items, ingredients, ingredient_sources,
-- menu_item_ingredients, dish_preferences, dining_experiences, tables,
-- chef_notes, restaurant_stories, gallery.
--
-- Idempotent. No restaurant facts are seeded: every value shown to the
-- public must be entered by the restaurant through the admin area.
-- =====================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------
create table if not exists public.restaurants (
  id                            uuid primary key default gen_random_uuid(),
  name                          text not null check (length(trim(name)) > 0),
  slug                          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tagline                       text,
  description                   text,
  address_line                  text,
  city                          text,
  region                        text,
  postal_code                   text,
  country                       text,
  phone                         text,
  email                         text,
  latitude                      numeric(9, 6) check (latitude between -90 and 90),
  longitude                     numeric(9, 6) check (longitude between -180 and 180),
  timezone                      text not null default 'UTC',
  currency                      text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  -- Admin-entered, e.g. {"mon":[{"open":"18:00","close":"23:00"}]}. Null = not published.
  opening_hours                 jsonb,
  reservation_duration_minutes  integer not null default 120
                                check (reservation_duration_minutes between 30 and 480),
  is_active                     boolean not null default true,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, slug)
);
create index if not exists categories_restaurant_idx on public.categories (restaurant_id, sort_order);

-- ---------------------------------------------------------------------
-- menu_items
-- diet_type / nutrition are nullable on purpose: unknown is better than
-- invented. Nutrition is admin-entered JSON, never generated.
-- ---------------------------------------------------------------------
create table if not exists public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  category_id    uuid references public.categories (id) on delete set null,
  name           text not null check (length(trim(name)) > 0),
  slug           text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description    text,
  story          text,
  chef_note      text,
  price          numeric(10, 2) not null check (price >= 0),
  image_url      text,
  spice_level    smallint not null default 0 check (spice_level between 0 and 5),
  diet_type      text check (diet_type in ('vegan', 'vegetarian', 'pescatarian', 'non_vegetarian')),
  dietary_tags   text[] not null default '{}',
  nutrition      jsonb,
  is_featured    boolean not null default false,
  is_chef_choice boolean not null default false,
  is_available   boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (restaurant_id, slug)
);
create index if not exists menu_items_category_idx   on public.menu_items (category_id);
create index if not exists menu_items_listing_idx    on public.menu_items (restaurant_id, is_available, sort_order);
create index if not exists menu_items_featured_idx   on public.menu_items (restaurant_id) where is_featured;
create index if not exists menu_items_diet_tags_idx  on public.menu_items using gin (dietary_tags);

-- ---------------------------------------------------------------------
-- ingredients / ingredient_sources / menu_item_ingredients
-- Provenance is only ever what the restaurant enters and publishes.
-- ---------------------------------------------------------------------
create table if not exists public.ingredients (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text,
  image_url     text,
  season        text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table if not exists public.ingredient_sources (
  id                 uuid primary key default gen_random_uuid(),
  ingredient_id      uuid not null references public.ingredients (id) on delete cascade,
  source_name        text not null check (length(trim(source_name)) > 0),
  source_type        text check (source_type in ('farm', 'supplier', 'market', 'foraged', 'in_house', 'other')),
  location           text,
  season_start_month smallint check (season_start_month between 1 and 12),
  season_end_month   smallint check (season_end_month between 1 and 12),
  harvest_date       date,
  notes              text,
  -- Nothing about a source is public until an admin explicitly publishes it.
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists ingredient_sources_ingredient_idx on public.ingredient_sources (ingredient_id);

create table if not exists public.menu_item_ingredients (
  menu_item_id  uuid not null references public.menu_items (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  is_primary    boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  primary key (menu_item_id, ingredient_id)
);
create index if not exists menu_item_ingredients_ingredient_idx on public.menu_item_ingredients (ingredient_id);

-- ---------------------------------------------------------------------
-- dish_preferences  (recommendation attributes for mood menu + Find My Dish)
-- A dish may have several rows (e.g. two moods); exact duplicates are blocked.
-- ---------------------------------------------------------------------
create table if not exists public.dish_preferences (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  mood         text check (mood in ('light', 'comfort', 'spicy', 'rich_creamy', 'chefs_choice', 'something_new')),
  flavor       text,
  texture      text,
  meal_type    text,
  occasion     text,
  spice_level  smallint check (spice_level between 0 and 5),
  created_at   timestamptz not null default now()
);
create index if not exists dish_preferences_menu_item_idx on public.dish_preferences (menu_item_id);
create index if not exists dish_preferences_mood_idx      on public.dish_preferences (mood);
create unique index if not exists dish_preferences_unique_idx on public.dish_preferences (
  menu_item_id,
  coalesce(mood, ''), coalesce(flavor, ''), coalesce(texture, ''),
  coalesce(meal_type, ''), coalesce(occasion, ''), coalesce(spice_level, -1)
);

-- ---------------------------------------------------------------------
-- dining_experiences  (Choose Your Experience — admin managed)
-- ---------------------------------------------------------------------
create table if not exists public.dining_experiences (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants (id) on delete cascade,
  title             text not null check (length(trim(title)) > 0),
  slug              text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description       text,
  image_url         text,
  min_guests        smallint check (min_guests >= 1),
  max_guests        smallint check (max_guests >= 1),
  -- Table areas this experience can be seated in. Empty = any area.
  available_areas   text[] not null default '{}'
                    check (available_areas <@ array['window', 'quiet', 'outdoor', 'main_hall', 'private_dining', 'garden', 'rooftop', 'bar']),
  preparation_notes text,
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (restaurant_id, slug),
  check (min_guests is null or max_guests is null or min_guests <= max_guests)
);
create index if not exists dining_experiences_listing_idx on public.dining_experiences (restaurant_id, is_active, sort_order);

-- ---------------------------------------------------------------------
-- tables  (floor plan; positions are percentages of the plan, 0-100)
-- ---------------------------------------------------------------------
create table if not exists public.tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  label         text not null check (length(trim(label)) > 0),
  area          text not null check (area in ('window', 'quiet', 'outdoor', 'main_hall', 'private_dining', 'garden', 'rooftop', 'bar')),
  min_capacity  smallint not null default 1 check (min_capacity >= 1),
  capacity      smallint not null check (capacity >= 1),
  shape         text not null default 'round' check (shape in ('round', 'square', 'rectangle')),
  pos_x         numeric(5, 2) not null default 0 check (pos_x between 0 and 100),
  pos_y         numeric(5, 2) not null default 0 check (pos_y between 0 and 100),
  width         numeric(5, 2) not null default 8 check (width > 0 and width <= 100),
  height        numeric(5, 2) not null default 8 check (height > 0 and height <= 100),
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, label),
  check (min_capacity <= capacity)
);
create index if not exists tables_restaurant_idx on public.tables (restaurant_id, area) where is_active;

-- ---------------------------------------------------------------------
-- chef_notes  (Chef's Desk — draft / scheduled / published / archived)
-- ---------------------------------------------------------------------
create table if not exists public.chef_notes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  ingredient_id uuid references public.ingredients (id) on delete set null,
  title         text not null check (length(trim(title)) > 0),
  body          text not null,
  image_url     text,
  status        text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  is_featured   boolean not null default false,
  publish_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (status <> 'scheduled' or publish_at is not null)
);
create index if not exists chef_notes_public_idx on public.chef_notes (restaurant_id, status, publish_at desc);

-- ---------------------------------------------------------------------
-- restaurant_stories  (Tonight's Stories)
-- Public only while: is_active AND published_at <= now() AND not expired.
-- ---------------------------------------------------------------------
create table if not exists public.restaurant_stories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  title         text not null check (length(trim(title)) > 0),
  description   text,
  media_url     text,
  story_type    text not null default 'kitchen'
                check (story_type in ('kitchen', 'chef', 'dish', 'ingredient', 'behind_the_scenes', 'event')),
  published_at  timestamptz,
  expires_at    timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (expires_at is null or published_at is null or expires_at > published_at)
);
create index if not exists restaurant_stories_live_idx on public.restaurant_stories (restaurant_id, published_at desc) where is_active;

-- ---------------------------------------------------------------------
-- gallery  (restaurant spaces & imagery; alt_text supports accessibility)
-- ---------------------------------------------------------------------
create table if not exists public.gallery (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  image_url     text not null,
  alt_text      text,
  caption       text,
  space         text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists gallery_listing_idx on public.gallery (restaurant_id, sort_order) where is_active;

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'restaurants', 'categories', 'menu_items', 'ingredients', 'ingredient_sources',
    'dining_experiences', 'tables', 'chef_notes', 'restaurant_stories', 'gallery'
  ] loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$s', t);
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- RLS — public content is readable by everyone where appropriate,
-- writable only by staff/admin. Nothing here is customer-private.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'restaurants', 'categories', 'menu_items', 'ingredients', 'ingredient_sources',
    'menu_item_ingredients', 'dish_preferences', 'dining_experiences', 'tables',
    'chef_notes', 'restaurant_stories', 'gallery'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %1$s_staff_all on public.%1$s', t);
    execute format(
      'create policy %1$s_staff_all on public.%1$s for all to authenticated
         using (public.is_staff()) with check (public.is_staff())', t);
    execute format('drop policy if exists %1$s_public_read on public.%1$s', t);
  end loop;
end $$;

create policy restaurants_public_read on public.restaurants
  for select to anon, authenticated using (is_active);

create policy categories_public_read on public.categories
  for select to anon, authenticated using (is_active);

-- Unavailable dishes stay visible (shown as unavailable); ordering logic is server-side.
create policy menu_items_public_read on public.menu_items
  for select to anon, authenticated using (true);

create policy ingredients_public_read on public.ingredients
  for select to anon, authenticated using (is_active);

create policy ingredient_sources_public_read on public.ingredient_sources
  for select to anon, authenticated using (is_published);

create policy menu_item_ingredients_public_read on public.menu_item_ingredients
  for select to anon, authenticated using (true);

create policy dish_preferences_public_read on public.dish_preferences
  for select to anon, authenticated using (true);

create policy dining_experiences_public_read on public.dining_experiences
  for select to anon, authenticated using (is_active);

create policy tables_public_read on public.tables
  for select to anon, authenticated using (is_active);

create policy chef_notes_public_read on public.chef_notes
  for select to anon, authenticated
  using (
    (status = 'published' and (publish_at is null or publish_at <= now()))
    or (status = 'scheduled' and publish_at <= now())
  );

create policy restaurant_stories_public_read on public.restaurant_stories
  for select to anon, authenticated
  using (
    is_active
    and published_at is not null and published_at <= now()
    and (expires_at is null or expires_at > now())
  );

create policy gallery_public_read on public.gallery
  for select to anon, authenticated using (is_active);

-- ---------------------------------------------------------------------
-- Grants (RLS still decides which rows; these only open the door)
-- ---------------------------------------------------------------------
grant select on
  public.restaurants, public.categories, public.menu_items, public.ingredients,
  public.ingredient_sources, public.menu_item_ingredients, public.dish_preferences,
  public.dining_experiences, public.tables, public.chef_notes,
  public.restaurant_stories, public.gallery
to anon, authenticated;

grant insert, update, delete on
  public.restaurants, public.categories, public.menu_items, public.ingredients,
  public.ingredient_sources, public.menu_item_ingredients, public.dish_preferences,
  public.dining_experiences, public.tables, public.chef_notes,
  public.restaurant_stories, public.gallery
to authenticated;

grant all on
  public.restaurants, public.categories, public.menu_items, public.ingredients,
  public.ingredient_sources, public.menu_item_ingredients, public.dish_preferences,
  public.dining_experiences, public.tables, public.chef_notes,
  public.restaurant_stories, public.gallery
to service_role;
