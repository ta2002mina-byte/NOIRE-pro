import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getRequiredAccess, isRole, roleSatisfies, type AccessLevel, type Role } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type SessionProfile = Pick<Tables<"profiles">, "id" | "email" | "full_name" | "phone" | "avatar_url" | "role">;

export interface AuthContext {
  user: User;
  profile: SessionProfile | null;
  role: Role;
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function loadContext(supabase: ServerClient): Promise<AuthContext | null> {
  // getUser() validates the token with Supabase; it does not just trust the cookie.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) console.error("[auth] Could not load profile:", profileError.message);

  // A missing profile or an unrecognised role gets the least privilege, never more.
  const role: Role = profile && isRole(profile.role) ? profile.role : "customer";
  return { user, profile: profile ?? null, role };
}

/** The signed-in user, their profile and their role. Null when signed out. Cached per request. */
export const getAuthContext = cache(async () => loadContext(await createClient()));

/**
 * Page guard. Call it at the top of EVERY private page (layouts alone are not enough, because
 * Next.js does not re-run a layout on each client-side navigation).
 *   - signed out             -> redirect to /signin (and back here afterwards)
 *   - signed in, wrong role  -> 404, so the admin area is not advertised
 */
export async function requireAccess(pathname: string): Promise<AuthContext> {
  const level = getRequiredAccess(pathname);
  const ctx = await getAuthContext();

  if (!ctx) redirect(`/signin?next=${encodeURIComponent(pathname)}`);
  if (!roleSatisfies(ctx.role, level)) notFound();
  return ctx;
}

export type AuthorizeResult =
  | { ok: true; supabase: ServerClient; ctx: AuthContext }
  | { ok: false; reason: "unauthenticated" | "forbidden"; message: string };

/**
 * Server-action guard. Server actions are ordinary POST endpoints that anyone can call,
 * so EVERY action that touches private data must start with this, and must take the user's
 * identity from ctx.user.id, never from form fields.
 */
export async function authorize(level: Exclude<AccessLevel, "public">): Promise<AuthorizeResult> {
  const supabase = await createClient();
  const ctx = await loadContext(supabase);

  if (!ctx) {
    return { ok: false, reason: "unauthenticated", message: "Your session has ended. Sign in again to continue." };
  }
  if (!roleSatisfies(ctx.role, level)) {
    return { ok: false, reason: "forbidden", message: "You don’t have permission to do that." };
  }
  return { ok: true, supabase, ctx };
}
