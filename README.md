# NOIRÉ — Your table. Your taste. Your story.

Next.js 15 (App Router) + TypeScript + Tailwind + Supabase.

| Phase | Status | Where |
|---|---|---|
| 1 Database | done | `supabase/` (see `supabase/README.md`), `types/database.ts` |
| 2 Authentication & authorization | done | `lib/auth`, `middleware.ts`, `app/(auth)`, `app/account`, `app/admin` |
| 3 Premium / cinematic public UI | done | `app/(public)`, `components/home`, `components/layout`, `lib/data` |
| 4 Mood-based menu | done | `app/(public)/menu`, `components/menu` |
| 5 Find My Dish | done | `app/(public)/find-my-dish`, `components/find-my-dish`, `lib/recommendations` |
| 6 Visual table reservation | done | `app/(public)/reserve`, `components/reserve`, `lib/actions/reservation.ts` |
| 7 Choose Your Experience | done | `app/admin/experiences`, `components/admin`, `lib/actions/experiences.ts` |
| 8 Customer Dining Journal | done | `app/account/journal`, `lib/actions/journal.ts` |
| 9 Dining Passport | done | `app/account/passport`, `lib/data/passport.ts` |
| 10 Chef's Desk + Source → Plate | done | `app/chef`, `app/our-ingredients`, `app/admin/chef`, `app/admin/ingredients` |
| 11 Admin Dashboard | done | `app/admin/*`, `components/admin`, `lib/data/admin-overview.ts`, `lib/data/customers.ts` |
| 12 Analytics + Tonight's Stories | done | `app/admin/analytics`, `lib/data/analytics.ts`, `lib/constants/analytics.ts`, `components/admin/analytics-*` |

| 13 SEO + performance + accessibility | done | `app/sitemap.ts`, `app/robots.ts`, metadata across routes |
| 14 Final QA + security | done | `PHASE14_QA_REPORT.md` |
| Completion pass | done | Favorites, Reviews (customer + admin + public), Admin Settings, Admin Passport, Admin Tables, Notifications |

**No database change in Phase 3.** It reads the tables from Phase 1 through the existing Supabase server client.

## Run it

```bash
npm install
cp .env.example .env.local        # fill in the two Supabase values
# apply the three migrations in supabase/migrations (see supabase/README.md)
npm run dev
```

Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

Email confirmation links must be opened **in the same browser** that requested them (PKCE).
For quick local testing you can turn off *Confirm email* under Authentication > Providers > Email.

Create your first admin (one time, in the SQL editor):

```sql
select public.set_user_role((select id from auth.users where email = 'you@example.com'), 'admin');
```

## What Phase 2 delivers

**Authentication** (all through server actions, validated with zod on the server)

- Customer sign up, sign in, sign out, forgot password, reset password, change password
- Sessions persist in secure cookies; the middleware refreshes them on every request
- Expired sessions: private pages redirect to `/signin?reason=expired`, and back to the page afterwards
- No account probing: sign-up and forgot-password give the same answer whether or not the email exists
- Sign-up can never choose a role. The database trigger always creates a `customer`

**Authorization** (one rule set: `lib/auth/access.ts`)

| Path | Who |
|---|---|
| `/account/*` (8 routes) | any signed-in user |
| `/admin/*` (12 routes) | `staff` and `admin` |
| `/admin/settings` | `admin` only |

Three layers, so no single one is a single point of failure:

1. **Middleware** sends signed-out visitors to `/signin` (fast redirect and cookie refresh).
2. **Page guards**: every private page calls `requireAccess(path)` on the server. Signed out means redirect; wrong role means `404`, so the admin area isn't advertised.
3. **Server actions** start with `authorize(level)`, and take the user id from the session, never from a form field.

Underneath all of it, Postgres **RLS** from Phase 1 still decides which rows a user can touch.

`normalizePath()` closes path tricks (`/%61dmin`, `/ADMIN`, `//admin`, `/account/../admin`, trailing slashes).
Malformed encodings fail closed. The post-login `next` parameter accepts only same-site relative paths.

**Also included:** profile editing (name, phone) at `/account/profile`, password change with current-password
re-check at `/account/settings`, baseline security headers, and honest placeholders for sections built in later phases.

## Phase 2 checks

```bash
npm test               # 12 unit tests for the access rules (Node 22+, no install needed)
npm run check:secrets  # fails if the service-role key is referenced by client-reachable code
npm run typecheck
npm run lint
npm run build
```

## Phase 2 manual test checklist

Signed out
- [ ] `/account` and `/admin/menu` redirect to `/signin?next=...`
- [ ] Sign in with a wrong password shows one generic error

Customer
- [ ] Sign up, confirm email, land on `/account`; a `customer` row exists in `profiles`
- [ ] `/admin` and `/admin/settings` show the 404 page
- [ ] `/account/profile` saves name and phone; `/account/settings` changes the password only with the right current password
- [ ] Sign out, then press Back: the account page is not shown from cache

Staff (set with `set_user_role(..., 'staff')`)
- [ ] Sign in lands on `/admin`; every section opens except `/admin/settings` (404)

Admin
- [ ] All 12 admin sections open; role badge shows `admin`
- [ ] Forgot password > email link > new password > signed in; other browsers are signed out

Isolation (SQL editor or two accounts)
- [ ] As customer A, `select * from profiles` returns only A's row

## What Phase 3 delivers

**Public routes** (all in the `app/(public)` route group, so the URLs are unchanged)

| Route | What it shows |
|---|---|
| `/` | Cinematic hero ("Dinner, reimagined." / Discover Tonight / Scroll to enter), then Tonight at NOIRÉ, Discover your mood, Find My Dish, Featured dishes, Choose Your Experience, Source → Plate, Chef's Desk, Tonight's stories, Restaurant spaces, Reservation CTA, Journal / Passport teaser, Location and hours, footer |
| `/menu`, `/menu/[slug]` | Dishes by course with image, price, spice, dietary tags, Chef's Choice / Featured and availability. The dish page adds story, chef's note and the ingredients the kitchen linked to it |
| `/chef` | Published (or scheduled-and-due) chef notes |
| `/our-ingredients` | Ingredients with **published** sourcing facts, season, harvest date and the dishes that use them |
| `/stories` | Stories that are live right now |
| `/space`, `/about`, `/contact` | Gallery grouped by space, restaurant description, address, phone, email and hours |
| `/reserve` | Hours and direct contact for now. The visual table map is Phase 6 and the page says so |

**Structure.** `app/(public)/layout.tsx` provides the skip link, header, `<main>` landmark and footer once, so pages render only their own content. It also has `loading.tsx` (skeleton), `error.tsx` and `not-found.tsx` that keep the site frame. Every page has one `<h1>`.

**Content honesty.** Every fact on the site comes from the database. When a table is empty, the section shows an empty state instead of placeholder copy. Sourcing, hours, chef notes and stories are shown only when the restaurant has entered and published them.

**Design.** Dark editorial palette, Bodoni Moda + Hanken Grotesk, restrained motion, `prefers-reduced-motion` respected everywhere, mobile-first grids, mobile drawer navigation.

### Fixed while finishing this phase

The Phase 3 files that came in were feature-complete but had issues, fixed without rebuilding anything:

1. **Staff saw unpublished content on the public site.** Phase 1 gives staff a `for all` policy, and policies are OR-ed, so a signed-in staff session could read drafts, archived chef notes, expired stories and **unpublished sourcing**. Public queries now apply the publish rules explicitly (`lib/data/visibility.ts`, unit-tested), so the site looks the same to everyone
2. **Colour contrast.** The claret text/icon accent was 2.6:1 on the dark background. Text and icons now use a new `blush` token (6.6:1). Claret stays for button backgrounds (ivory on claret is 6.2:1)
3. **Mobile menu.** The closed drawer was only transparent, so its links were still reachable by keyboard and screen reader. It is now hidden properly (`visibility` and `inert`) and Escape returns focus to the button
4. **Header.** Desktop navigation switched to the `lg` breakpoint (seven links plus buttons did not fit at 768px), the wrong "Reserve an account" label became "Create account", and a real **Reserve** button was added
5. **No `<h1>` on any inner page**, no skip link on public pages, and loading states on only two routes. All covered by the shared layout
6. **Copy that promised features that do not exist yet** (a "visual reservation" call to action, "Window tables, the bar, private dining" on the space page) was made neutral
7. **Dishes vanished** from `/menu` when their category was switched off. They now appear under "More"
8. **Raw values** such as `behind_the_scenes` and `2026-03-04` are now formatted, and a mistyped restaurant time zone no longer crashes the page

## Checks

```bash
npm test               # 17 unit tests: access rules (12) and public visibility rules (5)
npm run check:secrets  # fails if the service-role key is referenced by client-reachable code
npm run typecheck
npm run lint
npm run build
```

`npm test` needs no install (Node 22+). The other four need `npm install` first.

## Phase 3 manual test checklist

Public, signed out
- [ ] `/` loads with every section; with an empty database each section shows its empty state, not an error
- [ ] Press Tab once on any public page: "Skip to main content" appears and jumps past the header
- [ ] At 375px the menu button opens a drawer; Tab cannot reach its links while it is closed; Escape closes it and focus returns to the button
- [ ] `/menu` groups dishes by course; a dish marked unavailable shows "Not available tonight"; `/menu/does-not-exist` shows the in-frame "This table doesn't exist" page
- [ ] `/our-ingredients` shows only sources with `is_published = true`
- [ ] Turn on "Reduce motion" in your OS: the bouncing scroll arrow and hover zooms stop

Content rules (do these signed in as **admin**, then signed out, and compare)
- [ ] A story with `expires_at` in the past does not appear on `/stories` or the home page, in either session
- [ ] A chef note with status `draft`, `archived`, or `scheduled` for the future does not appear on `/chef`
- [ ] An ingredient source with `is_published = false` does not appear on `/our-ingredients`

## Deliberately not in this phase

- `/menu?mood=…` links exist on the home page, but filtering by mood is Phase 4
- Find My Dish is a teaser that points to the menu; the quiz is Phase 5
- Reservations are contact-only until the visual table reservation (Phase 6)
- Journal, passport, favorites, reviews and the admin tools are still labelled placeholders (Phases 8 to 12)
- Images are plain lazy-loaded `<img>` tags because image URLs are admin-entered; optimization is Phase 13
- Sitemap, robots, Open Graph and structured data are Phase 13

## What Phase 7 delivers

The `dining_experiences` table, its RLS policies, and the reservation wizard's experience
step were already in place from Phases 1 and 6. Phase 7 closes the loop with the
**admin side**: `/admin/experiences` (staff and admin) is no longer a placeholder.

- **List** (`/admin/experiences`) — every experience as a premium mobile-first card, active
  or not, with title, guest range, areas, display order, and quick actions.
- **Create** (`/admin/experiences/new`) and **edit** (`/admin/experiences/[id]`) — one shared
  form (`components/admin/experience-form.tsx`) for title, slug (auto-generated from the
  title if left blank), description, image URL, min/max guests, available areas (the same
  `TABLE_AREAS` list the reservation flow already uses), internal preparation notes, display
  order, and active status.
- **Activate / Deactivate** — a single click, no form. Inactive experiences stop appearing on
  the homepage and in the reservation flow (RLS already filters on `is_active`), but nothing
  already booked is affected.
- **Delete** — a type-free confirm step. Deleting an experience never touches its
  reservations: `reservations.experience_id` is `on delete set null`, so bookings keep their
  table, date and time and simply lose the experience label. The edit page shows how many
  upcoming reservations are tied to an experience before you act.

All of it goes through `authorize("staff")`, re-validates with the same zod schema
(`lib/validations/experience.ts`) on the server regardless of what the client sent, and
relies on Postgres RLS underneath, per the same three-layer model as every other admin
action in this project. No hardcoded experience content exists anywhere — the homepage
section and the reservation wizard already read only from this table.

Not built in this phase (unchanged from earlier phases): image upload (image is a URL field,
same as the rest of the project's admin-entered media), and drag-and-drop reordering (use the
numeric "Display order" field instead).

## What Phase 10 delivers

`chef_notes`, `ingredients`, `ingredient_sources` and `menu_item_ingredients` — and every RLS
policy they need — already existed from Phase 1's foundation migration, and the **public**
`/chef` and `/our-ingredients` pages were already reading real data from them since Phase 3.
Like Phase 7, this phase closes the loop with the **admin side** only; no new migration was
needed.

- **Chef's Desk** (`/admin/chef`) — create, edit, and delete notes; an optional link to one
  ingredient; **Featured** flag; and a **Status** select (Draft / Scheduled / Published /
  Archived) with a **Publish at** field, enforcing the same "scheduled notes need a publish
  time" rule as the database check constraint. Each card also gets one-click status actions
  (Publish now, Unpublish, Archive, Cancel schedule, Restore to draft) so the common moves
  don't require opening the full form.
- **Ingredients** (`/admin/ingredients`) — create/edit/delete an ingredient's own facts (name,
  slug, description, image, season, active). Once created, its edit page adds two sub-panels:
  - **Sourcing** — add, edit, publish/unpublish, and delete as many sourcing entries as an
    ingredient needs (source name, type, location, season window, harvest date, notes). Only
    `is_published` sources ever reach `/our-ingredients`, matching the Phase 1 policy.
  - **Used in dishes** — a checklist of every menu item; saving replaces the ingredient's full
    set of links in `menu_item_ingredients` in one action.

No sourcing fact is ever invented: every field on `/our-ingredients` traces directly to a value
staff entered on this admin page, per the Phase 10 brief.

Not built in this phase: image upload (image URL fields only, same as the rest of the admin
area), and reordering ingredients or sources (both list alphabetically).

## What Phase 11 delivers

The NOIRÉ admin dashboard, built on the same three-layer pattern as every prior admin
phase: a zod schema in `lib/validations`, a `"use server"` action file in `lib/actions`
(authorize → validate → mutate → revalidate), and a data layer in `lib/data` that never
trusts the client. Several sections — **Reservations** (calendar-lite date filter, visual
floor plan, inline status changes, full edit form) and the **Menu** data/action layer —
were already built in earlier phases and are documented here for completeness; this phase
closes the remaining gaps:

- **Overview** (`/admin`) — today's reservation and guest counts, table occupancy, special
  occasions, an experience breakdown, recent activity, and operational alerts (unconfirmed
  reservations, unassigned tables, no active tables configured).
- **Tonight** (`/admin/tonight`, new nav entry) — today's live reservations in time order
  with table, experience, occasion and special-request detail, the floor plan, and
  whatever's currently live on the public site via `getLiveStories`.
- **Menu** (`/admin/menu`) — dish CRUD wired up: story, chef's note, ingredients (via the
  same replace-the-set junction pattern as Ingredients → Dishes), nutrition, spice,
  dietary tags, availability, feature flags, and recommendation attributes
  (`dish_preferences`, one row per dish, driving the mood menu and Find My Dish).
- **Stories** (`/admin/stories`) — full CRUD for `restaurant_stories`: title, description,
  media, type, publish/expiry timestamps, active state, with one-click publish-now/unpublish.
- **Customers** (`/admin/customers`) — searchable, paginated list (`profiles` +
  `dining_passports` for visit/dish counts) and a read-only detail page aggregating
  verified visits (`dining_history`), dishes tried (`dining_journal`), favorites, reviews,
  last visit and favorite experience.

Every destructive action goes through a shared confirm step
(`components/admin/confirm-action-button.tsx`); every quick status change goes through a
shared one-click component (`components/admin/quick-action-button.tsx`). Both are new in
this phase and used across Stories, Menu and Experiences so the interaction pattern is
identical everywhere.

Not built in this phase, on purpose: **Reviews**, **Dining Passport** (admin side),
**Settings**, and **Analytics** stay as placeholders. None of the four were detailed in
the Phase 11 requirements — Analytics is explicitly Phase 12's job — so nothing was
fabricated to fill the nav.

## What Phase 12 delivers

**Tonight's Stories was already done.** `restaurant_stories`, its RLS policies, `getLiveStories()` /
`isStoryLive()` (Phase 3), the homepage "Tonight at NOIRÉ" and "Tonight's stories" sections, the public
`/stories` page, and the full `/admin/stories` CMS (Phase 11) already use the current date/time and
admin-managed publish/expiry windows correctly. Nothing needed fixing there, so this phase closes the
one remaining gap in the nav: **Analytics**.

- **`/admin/analytics`** (staff and admin, same as every other admin section) — a date-range report
  (Last 7 / 30 / 90 days / All time, kept in the URL as `?range=`) covering:
  - **Reservations** — volume (daily chart, most recent 30 days of the selected range), guests seated,
    cancellation rate, no-show rate, and the share of active reservations that chose a curated
    experience (the closest real "conversion" signal this app tracks — there's no page-view funnel).
  - **Occasions** and **Experience selections** — breakdowns over the period, same source data as the
    Overview page's "today" version (`lib/data/admin-overview.ts`), just windowed and totaled instead
    of daily.
  - **Table utilization** — average share of active tables booked per day the restaurant took a
    booking, across the period.
  - **Visits and repeat guests** — from `dining_history` (verified visits, not raw reservations):
    distinct guests, how many came back more than once, and the repeat rate.
  - **Dishes** — most journaled (from `dining_journal`, i.e. dishes guests actually logged) and most
    favorited (from `favorites`), each scoped to the selected period.
  - **Dining journal activity** — entries logged, how many carried a rating, and the average rating.
  - **Taste analytics** — popular moods, spice preference, and flavor/texture preferences, all read
    from `taste_profiles`. This is a snapshot of what customers have *saved*, not a log of every Find
    My Dish quiz run (the app only ever upserts one taste profile per customer — see
    `lib/actions/find-my-dish.ts` — so a per-quiz outcome log doesn't exist to report from).
  - **Story activity** — stories live right now, stories published in the period, and a breakdown by
    type. Labelled "activity," not "engagement": NOIRÉ has no page-view or click tracking, so reporting
    reader engagement would mean inventing a number that isn't backed by anything stored.

All of it is aggregated in application code from a handful of batched, `Promise.all`'d queries
(`lib/data/analytics.ts`), the same approach `lib/data/admin-overview.ts` already uses and for the same
reason — a dedicated SQL view or RPC isn't worth the migration surface at NOIRÉ's data volume. No
individual guest is named anywhere on the page; every figure is a count, a rate, or a total.

Not built in this phase, on purpose: a raw event/analytics log (page views, quiz-run outcomes) —
adding one would be a database change with its own tracking-consent implications, which Phase 12's
brief doesn't ask for and nothing in the running app currently needs.


## Customer avatar uploads

`/account/profile` now has a profile-photo uploader, same widget as the admin forms. A
signed-in customer can only write under their own `avatars/<their user id>/` path in the
`media` bucket — enforced by storage RLS, not just the UI — so one customer can never
overwrite another's photo. Shown next to the welcome heading on `/account`.

**Setup (one time):** apply `supabase/migrations/20260929000200_noire_06_avatar_storage.sql`
the same way as the others. It only adds policies to the bucket created in the Phase 15
migration, so that one must be applied first.

## Gallery / Restaurant Spaces (admin panel)

`/admin/gallery` manages the room photos shown on the homepage's "Restaurant spaces" section
and on `/space` — add, edit, reorder (`sort_order`, lower first), group by a free-text `Space`
name (e.g. "Main Hall", "Rooftop"), and activate/deactivate. Uses the same image-upload field as
the other admin forms.

## Image uploads (admin panel)

Admins/staff can now upload images directly from the admin forms — Menu items, Ingredients,
Chef's Desk, Restaurant Stories, Experiences, and Gallery/Restaurant Spaces — instead of only pasting a URL.

**Setup (one time):** apply `supabase/migrations/20260929000100_noire_05_storage.sql` like the
others (SQL editor or `supabase db push`). It creates a public Storage bucket named `media`
(5MB/file, JPEG/PNG/WebP/GIF only) and locks writes to staff/admin via RLS — nothing else to
configure, no new environment variables.

**How it works:** the upload happens straight from the browser to Supabase Storage, authenticated
as the signed-in staff session (same RLS everything else in this app relies on). The resulting
public URL is written into the same field the form already validates and saves — so an admin can
also just paste an external URL there instead, exactly as before.

## Completion pass (after Phase 14)

Closed the five gaps listed in `PHASE14_QA_REPORT.md` and two more found afterwards:

- **Favorites** — `/account/favorites`, save/unsave on `/menu/[slug]` (`lib/actions/favorites.ts`).
- **Reviews** — customer form and list at `/account/reviews`; staff moderation at `/admin/reviews`; approved reviews are shown, anonymously, on each dish page (`components/menu/dish-reviews.tsx`). New reviews always start *pending* (DB trigger).
- **Admin Settings** — `/admin/settings` (admin only): details, opening hours, reservation length. Loads the restaurant even when it is set inactive, so it can be re-activated.
- **Admin Passport** — `/admin/passport`: read-only overview derived from verified visits.
- **Admin Tables** — `/admin/tables`: add/edit/deactivate/delete tables and their floor-plan position. A table with pending or confirmed reservations can't be deleted (deactivate it instead).
- **Notifications** — `/account/notifications`. Staff confirming or cancelling a reservation sends the guest a notice.

Navigation tests now expect 9 account and 14 admin sections.

Still to run on a machine with network access (this environment had none): `npm install && npm run lint && npm run typecheck && npm run build`.

## AI menu guide (optional)

Set `ANTHROPIC_API_KEY` (see `.env.example`) and a floating "Ask the menu guide" chat appears on the public site.
It answers from the live menu, never books tables, and always sends allergy questions to staff. Per-visitor and
site-wide daily caps (`ASSISTANT_DAILY_LIMIT_*`) limit cost. Without the key the button simply isn't shown.
