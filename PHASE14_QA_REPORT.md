# NOIRÉ — Phase 14: Final QA + Security + Polish

Audit performed on the Phase 13 codebase (`noire-phase13-ready.zip`). No dependencies could
be installed in this environment (no network access), so `npm run build` / `next lint` /
`tsc` could not be executed here — run those in CI/local before deploying. Everything below
is a manual code + schema audit plus the project's own `node --test` suite, which *was*
runnable (pure TypeScript, no external deps).

## 1. QA Summary

- Ran the existing test suite (`tests/access.test.mjs`, `tests/visibility.test.mjs`): **17/17 passing** after one fix (see below).
- Reviewed every server action under `lib/actions/` and `lib/account/`, all Supabase RLS/migrations under `supabase/migrations/`, middleware, and the access-control module.
- Checked for common web app issues: XSS surfaces, open redirects, secret exposure, ownership bypass, race conditions, broken internal links, missing `alt` text, reduced-motion support.
- Result: the codebase is in strong shape. One real bug found (stale test), zero security vulnerabilities found, and a handful of **known incomplete sections** (placeholders, not bugs) that should be tracked before calling the product done.

## 2. Security Findings

No exploitable vulnerabilities found. Specifically verified:

- **Service-role key**: never referenced anywhere in the codebase — not client, not server actions. `scripts/check-secrets.mjs` guards against future leaks.
- **Auth/session**: middleware uses `supabase.auth.getUser()` (server-verified), not `getSession()` (cookie-trusted only). Private routes get `Cache-Control: private, no-store`.
- **Path/role authorization**: `lib/auth/access.ts` normalizes paths (decodes, lower-cases, resolves `..`, fails closed on undecodable input) before deciding access — blocks case, encoding, and traversal tricks. Confirmed by `tests/access.test.mjs`.
- **Open redirect**: `getSafeRedirectPath` rejects absolute URLs, `//host`, backslashes, control characters, and the auth pages themselves.
- **Reservation race conditions**: booking is re-validated server-side against live data at submit time, and a DB exclusion constraint is the final backstop — an insert that loses the race fails with a specific Postgres error code and surfaces a friendly "someone else booked that" message rather than double-booking.
- **Ownership enforcement**: every mutation on journal, reservations, profile, and reviews (server actions + RLS + DB triggers) filters by `customer_id = auth.uid()`; the design explicitly defends in depth (server action check + RLS + trigger), not just one layer.
- **Password change**: re-verifies the current password via `signInWithPassword` before allowing a change, and signs out all other sessions afterward.
- **Passport milestones**: award logic is idempotent (`on conflict ... do nothing` on a unique `(customer_id, milestone_key)` index) and derived only from `dining_history`, not client input.
- **JSON-LD structured data**: manually escapes `<` before injecting via `dangerouslySetInnerHTML`, preventing script-tag breakout from admin-entered text.
- **No `eval`/`new Function`**, no stray `console.log` of sensitive data, no hardcoded credentials, no `.env` files bundled.

Minor, non-exploitable observation: `optionalUrl` (used for admin-entered image URLs) accepts any URL scheme accepted by `new URL()`, not just `http(s)`. Since this field is admin/staff-only input rendered through `next/image`'s `src` (not an anchor `href`), the practical risk is negligible — flagging only for completeness.

## 3. Fixed Issues

1. **Stale test assertion** — `tests/access.test.mjs` asserted `ADMIN_NAV.length === 12`, but `ADMIN_NAV` (in `lib/constants/navigation.ts`) correctly lists all 13 sections from the Phase 11 spec (Overview, Tonight, Reservations, Menu, Experiences, Chef's Desk, Ingredients, Stories, Customers, Dining Passport, Reviews, Analytics, Settings). The app code was right; the test was outdated. Updated the assertion to `13`. All 17 tests now pass.

No other code defects were found during this pass — everything else inspected (access control, reservation logic, ownership checks, secret handling) was already correct.

## 4. Remaining Issues (found during QA, not fixed in this pass)

These are **incomplete features**, not bugs introduced by Phase 14 — they were left as placeholders in earlier phases and surfaced now because Phase 14 is the first pass that exercises every route on the map:

| Area | Status | Detail |
|---|---|---|
| `/account/favorites` | Placeholder | Database table + RLS exist; no toggle action or listing UI was ever built. |
| `/account/reviews` | Placeholder | Full DB schema exists (ratings, one-review-per-dish, verified-visit trigger), but there's no customer-facing submission form. |
| `/admin/reviews` | Placeholder | No moderation UI to publish/hide pending reviews. |
| `/admin/settings` | Placeholder | No UI for restaurant details, hours, or reservation rules — admins currently can't manage these. |
| `/admin/passport` | Placeholder | Admin-side milestone visibility not built (customer-side `/account/passport` is fully implemented). |

Because Phase 14's scope is QA, security, and polish — not new feature development — I did not build these out now; doing so surgically without design input risked scope creep. Recommend a short, explicit follow-up phase to close these five gaps before launch, since three of them (Reviews, Favorites) are named in the public feature map.

Build/lint/type-check status: not independently verifiable in this environment (no network to install `node_modules`). Please run `npm install && npm run lint && npm run typecheck && npm run build` in CI before deploying — nothing found in this audit suggests they'll fail, but they haven't been executed against this exact tree.

## 5. Production-Readiness Checklist

- [x] Authentication & session handling verified secure
- [x] Role-based access control verified (customer/staff/admin), fails closed
- [x] RLS + server-side checks present on all customer data mutations
- [x] Reservation race conditions handled at the database level
- [x] Passport milestones idempotent and server-derived
- [x] No secrets or service-role key exposed to the client
- [x] No XSS/injection surfaces found
- [x] Internal links resolve to real routes (static check)
- [x] Images have alt text (or explicitly empty/decorative)
- [x] Reduced-motion support present in global styles
- [x] Test suite passing (17/17)
- [ ] `npm run build` / `lint` / `typecheck` — run in an environment with registry access
- [ ] Favorites, Reviews (customer + admin), Admin Settings, Admin Passport — implement before launch

---

## Addendum — completion pass

The five "Remaining Issues" above (favorites, customer reviews, admin reviews, admin settings, admin passport) are now implemented. Also added: admin table management (`/admin/tables`), a customer notifications inbox with automatic reservation confirm/cancel notices, and public display of approved dish reviews. Fixed one bug: admin settings could not load a restaurant that had been set inactive. `npm test`: 17/17 (nav-count assertions updated for the two new sections). `npm run build` / `lint` / `typecheck` still need to be run where the registry is reachable.
