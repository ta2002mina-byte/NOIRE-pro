/**
 * Access rules for every route, as pure functions with no framework imports.
 * The middleware, the page guards and the server actions all read from here,
 * so there is exactly one place that decides who may go where.
 */

export const ROLES = ["customer", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** public: anyone. user: any signed-in account. staff: staff or admin. admin: admin only. */
export type AccessLevel = "public" | "user" | "staff" | "admin";

/** Admin sections that staff must not open. Everything else under /admin is open to staff and admin. */
export const ADMIN_ONLY_PREFIXES: readonly string[] = ["/admin/settings"];

/** Pages that are pointless once you are signed in. */
export const GUEST_ONLY_PATHS: readonly string[] = ["/signin", "/signup", "/forgot-password"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Canonical form of a path for access decisions: no query/hash, decoded once,
 * lower-case, single slashes, dot-segments resolved. Returns null when the path
 * cannot be decoded, and callers must treat that as "deny".
 * This closes tricks like /%61dmin, /Admin, //admin, /account/../admin and /admin/.
 */
export function normalizePath(input: string): string | null {
  let path = input.split(/[?#]/)[0] ?? "";
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  path = path.replace(/\\/g, "/").toLowerCase();

  const segments: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") segments.pop();
    else segments.push(segment);
  }
  return `/${segments.join("/")}`;
}

function isWithin(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function getRequiredAccess(pathname: string): AccessLevel {
  const path = normalizePath(pathname);
  if (path === null) return "admin"; // fail closed

  if (isWithin(path, "/admin")) {
    return ADMIN_ONLY_PREFIXES.some((prefix) => isWithin(path, prefix)) ? "admin" : "staff";
  }
  if (isWithin(path, "/account")) return "user";
  return "public";
}

export function roleSatisfies(role: Role | null, level: AccessLevel): boolean {
  switch (level) {
    case "public":
      return true;
    case "user":
      return role !== null;
    case "staff":
      return role === "staff" || role === "admin";
    case "admin":
      return role === "admin";
  }
}

export function canAccessPath(role: Role | null, pathname: string): boolean {
  return roleSatisfies(role, getRequiredAccess(pathname));
}

export function isGuestOnlyPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path !== null && GUEST_ONLY_PATHS.includes(path);
}

export function getDefaultLandingPath(role: Role | null): string {
  return role === "staff" || role === "admin" ? "/admin" : "/account";
}

/**
 * Validates a user-supplied "go here after signing in" value.
 * Returns a same-site relative path, or null if it is missing or unsafe
 * (absolute URLs, protocol-relative //host, backslashes, control characters,
 * or the auth pages themselves, which would cause a redirect loop).
 */
export function getSafeRedirectPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  const value = next.trim();
  if (!value || value.length > 512) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;

  const path = normalizePath(value);
  if (path === null || isWithin(path, "/auth") || isGuestOnlyPath(path)) return null;
  return value;
}

/** Where to send someone after signing in: their requested page if they may open it, else their home. */
export function resolvePostLoginPath(role: Role | null, requested: unknown): string {
  const safe = getSafeRedirectPath(requested);
  if (safe && canAccessPath(role, safe)) return safe;
  return getDefaultLandingPath(role);
}
