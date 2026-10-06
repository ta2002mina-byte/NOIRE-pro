// Run with: npm test   (Node 22+, runs the TypeScript source directly)
import test from "node:test";
import assert from "node:assert/strict";

import {
  canAccessPath,
  getDefaultLandingPath,
  getRequiredAccess,
  getSafeRedirectPath,
  isGuestOnlyPath,
  isRole,
  resolvePostLoginPath,
  roleSatisfies,
} from "../lib/auth/access.ts";
import { ACCOUNT_NAV, ADMIN_NAV } from "../lib/constants/navigation.ts";

test("public pages need no sign-in", () => {
  for (const p of ["/", "/menu", "/menu/truffle-pasta", "/chef", "/reserve", "/signin", "/auth/callback"]) {
    assert.equal(getRequiredAccess(p), "public", p);
  }
});

test("/account/* needs a signed-in user", () => {
  for (const p of ["/account", "/account/journal", "/account/passport", "/account/reservations"]) {
    assert.equal(getRequiredAccess(p), "user", p);
  }
});

test("/admin/* needs staff, except admin-only sections", () => {
  assert.equal(getRequiredAccess("/admin"), "staff");
  assert.equal(getRequiredAccess("/admin/reservations"), "staff");
  assert.equal(getRequiredAccess("/admin/settings"), "admin");
  assert.equal(getRequiredAccess("/admin/settings/anything"), "admin");
});

test("path tricks cannot downgrade the required level", () => {
  const admin = ["/ADMIN", "/Admin/", "//admin", "/admin//reservations", "/%61dmin", "/%41dmin/menu", "/account/../admin", "/./admin", "/\\admin", "/admin?x=1", "/admin#top"];
  for (const p of admin) assert.equal(getRequiredAccess(p), "staff", p);

  for (const p of ["/admin/SETTINGS", "/%61dmin/%73ettings", "/admin/x/../settings", "/admin/settings/"]) {
    assert.equal(getRequiredAccess(p), "admin", p);
  }
  for (const p of ["/ACCOUNT/journal", "/%61ccount"]) assert.equal(getRequiredAccess(p), "user", p);
});

test("malformed encodings fail closed", () => {
  assert.equal(getRequiredAccess("/%E0%A4%A"), "admin");
});

test("role matrix", () => {
  const matrix = [
    [null, "public", true], [null, "user", false], [null, "staff", false], [null, "admin", false],
    ["customer", "public", true], ["customer", "user", true], ["customer", "staff", false], ["customer", "admin", false],
    ["staff", "user", true], ["staff", "staff", true], ["staff", "admin", false],
    ["admin", "user", true], ["admin", "staff", true], ["admin", "admin", true],
  ];
  for (const [role, level, expected] of matrix) {
    assert.equal(roleSatisfies(role, level), expected, `${role} -> ${level}`);
  }
});

test("customers are kept out of admin, staff out of admin settings", () => {
  assert.equal(canAccessPath("customer", "/admin"), false);
  assert.equal(canAccessPath("customer", "/account/profile"), true);
  assert.equal(canAccessPath("staff", "/admin/menu"), true);
  assert.equal(canAccessPath("staff", "/admin/settings"), false);
  assert.equal(canAccessPath("admin", "/admin/settings"), true);
  assert.equal(canAccessPath(null, "/account"), false);
});

test("unknown role values are rejected", () => {
  assert.equal(isRole("admin"), true);
  for (const bad of ["Admin", "root", "", null, undefined, 1, {}]) assert.equal(isRole(bad), false);
});

test("safe redirect accepts only same-site relative paths", () => {
  for (const ok of ["/account", "/admin/menu", "/menu/pasta?x=1", "/reserve#table", "/reset-password"]) {
    assert.equal(getSafeRedirectPath(ok), ok, ok);
  }
  const bad = ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", "", "  ", "/a\nb", "/a\tb", null, undefined, 42, "/signin", "/signup", "/auth/callback", "/x".repeat(300)];
  for (const value of bad) assert.equal(getSafeRedirectPath(value), null, String(value));
});

test("post-login destination respects the role", () => {
  assert.equal(getDefaultLandingPath("customer"), "/account");
  assert.equal(getDefaultLandingPath("staff"), "/admin");
  assert.equal(getDefaultLandingPath("admin"), "/admin");
  assert.equal(resolvePostLoginPath("customer", "/account/journal"), "/account/journal");
  assert.equal(resolvePostLoginPath("customer", "/admin/menu"), "/account");
  assert.equal(resolvePostLoginPath("staff", "/admin/settings"), "/admin");
  assert.equal(resolvePostLoginPath("admin", "/admin/settings"), "/admin/settings");
  assert.equal(resolvePostLoginPath("staff", "https://evil.com"), "/admin");
  assert.equal(resolvePostLoginPath("customer", undefined), "/account");
});

test("guest-only pages", () => {
  assert.equal(isGuestOnlyPath("/signin"), true);
  assert.equal(isGuestOnlyPath("/SignUp/"), true);
  assert.equal(isGuestOnlyPath("/reset-password"), false);
  assert.equal(isGuestOnlyPath("/account"), false);
});

test("navigation lists match the routes and access levels", () => {
  assert.equal(ACCOUNT_NAV.length, 9);
  assert.equal(ADMIN_NAV.length, 17);
  for (const item of ACCOUNT_NAV) assert.equal(getRequiredAccess(item.href), "user", item.href);
  for (const item of ADMIN_NAV) {
    assert.equal(getRequiredAccess(item.href), item.adminOnly ? "admin" : "staff", item.href);
  }
});
