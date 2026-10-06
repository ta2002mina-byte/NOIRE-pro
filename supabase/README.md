# NOIRÉ — Database (Phase 1)

Idempotent migrations for the NOIRÉ database foundation (23 tables), with RLS,
integrity rules, generated TypeScript types and a test suite.

```
supabase/migrations/
  20260920000100_noire_01_foundation.sql   profiles, roles, signup trigger, shared guards
  20260920000200_noire_02_content.sql      restaurants, menu, ingredients, experiences, tables, chef notes, stories, gallery
  20260920000300_noire_03_customer.sql     reservations, history, journal, passport, taste, favorites, reviews, notifications
supabase/tests/                            local-Postgres mock + 97 behaviour checks (RLS, rules, races)
types/database.ts                          `Database` types for createClient<Database>()
scripts/gen-db-types.py                    regenerates the types from a live database
```

## Apply

Drop `supabase/migrations/*` into the project's `supabase/migrations/` folder and run `supabase db push`
(or paste the three files, in order, into the Supabase SQL editor). Safe to run again.
Copy `types/database.ts` into the project's `types/` folder.

## First admin (one time)

Nobody can promote themselves. In the SQL editor (which has no user session) run:

```sql
select public.set_user_role((select id from auth.users where email = 'you@example.com'), 'admin');
```

Later, admins can use `set_user_role(user_id, role)` (`customer` | `staff` | `admin`) from a server action.

## Nothing is pre-filled

No restaurant, dish, chef, sourcing or hours data is seeded. Create the restaurant row first
(`name`, `slug`; then `timezone`, `currency`, `opening_hours`, `reservation_duration_minutes`).
Defaults are only placeholders: `timezone = 'UTC'`, `currency = 'USD'`, reservation length 120 min.

## Security model

| Data | Public | Customer | Staff / admin |
|---|---|---|---|
| restaurants, categories, menu, dish preferences, experiences, floor plan, gallery | read (active rows) | read | full |
| ingredient sources | read **only if `is_published`** | read published | full |
| chef notes | published / due-scheduled | same | full |
| stories | live only (active, started, not expired) | same | full |
| reviews | published only | own (always created `pending`) | moderate |
| reservations | — | own; create as `pending`, cancel, edit request | full |
| dining history (verified visits) | — | read own | full (auto-created when a reservation is `completed`) |
| journal | — | own only (**staff cannot read**) | — |
| passport, milestones | — | read own, **no writes** | full / server |
| favorites, taste profile | — | own only | — |
| notifications | — | read own, mark read | create |

Guarantees enforced in the database (not just the UI):

- **No double booking**: an exclusion constraint rejects overlapping `pending`/`confirmed` bookings of one table,
  including under concurrent requests. Cancelled / completed / no-show free the table.
- Reservation checks: table belongs to the restaurant and is active, guest count fits table capacity and the
  experience's range, table area is allowed for the experience, inactive experiences can't be newly booked.
- One live reservation per customer per date+time.
- Customers can never confirm/complete their own reservation, publish their own review, flip `is_verified_visit`,
  write dining history, raise passport counts, award milestones, or change a role.
- `is_verified_visit` is computed from `dining_history`; milestones are unique per customer.
- The signup trigger always creates `customer` profiles; user-supplied metadata never decides the role.
- `reserved_table_ids(restaurant, date, time)` lets the public floor plan grey out taken tables without exposing
  anyone's reservation. It is a display helper; confirmation must still be decided by the server / constraint.

The service-role key bypasses RLS: use it only in server code, never in the browser.

## Notes for the next phases

- `dining_journal.order_id` has no foreign key because NOIRÉ has no orders table yet.
- `passport_milestones` records what was **awarded**; the milestone rules (First Visit, Explorer, …) belong in
  server code in Phase 9. `dining_history` records verified *visits*; if "dishes explored" must be verified too,
  Phase 9 needs a small table linking visits to dishes.
- If a table already exists in your project, `create table if not exists` leaves it untouched. Compare it with the
  definition here (Phase 0 audit) and add missing columns in a follow-up migration.
- Migrations use `btree_gist` (in the `extensions` schema) for the booking constraint.

## Tests

```
psql -d <scratch_db> -f supabase/tests/00_local_supabase_mock.sql     # fake auth schema, plain Postgres only
psql -d <scratch_db> -f supabase/migrations/<each file, in order>
psql -d <scratch_db> -f supabase/tests/10_rls_and_rules_test.sql -o /dev/null
psql -d <scratch_db> -c "select * from t.results where not ok"        # expect 0 rows
```

Do not run the mock file on a real Supabase project.

## Phase 16 — Site content (hero, banner, footer)

`20260930000100_noire_07_site_content.sql` adds `site_content` (one row per restaurant, public read,
staff/admin write). Edited at `/admin/content`. Blank fields fall back to the built-in text, so nothing
breaks if the row doesn't exist yet. Run `supabase db push` (or paste the file into the SQL editor).

## Phase 17 — Contact messages

`20260930000200_noire_08_contact_messages.sql` adds `contact_messages` (anyone can send; only staff/admin can read,
update or delete). Messages from the Contact page appear at `/admin/messages`. Run `supabase db push` again.

## Email (optional)

Set `RESEND_API_KEY` and `EMAIL_FROM` (see `.env.example`) to email guests when a reservation is confirmed or
cancelled, and to alert the restaurant about new contact messages. Without them the site works the same.

## Phase 18 — Footer logo / background image

`20260930000300_noire_09_footer_media.sql` adds two optional columns (`footer_logo_url`, `footer_image_url`) to
`site_content`. Set either, both or neither at `/admin/content`. Run `supabase db push` again.

## Sample data (optional)

`supabase/seed/sample-data.sql` fills a demo restaurant (16 dishes, 4 categories, ingredients with sources, 4
experiences, 14 tables, chef notes, stories). Run it once in the SQL editor after the migrations; running it again
adds nothing twice. Everything is fictional — replace it from `/admin` before launch. Images are not included.
