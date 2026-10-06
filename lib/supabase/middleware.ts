import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getRequiredAccess } from "@/lib/auth/access";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/** Carries refreshed session cookies over to a redirect so the browser keeps the new tokens. */
function redirectWithCookies(request: NextRequest, source: NextResponse, pathname: string, search: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;

  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/**
 * Runs on every request: refreshes the session and sends signed-out visitors away from private areas.
 *
 * This is the FIRST line of defence, for a fast redirect and fresh cookies. It is not the only one:
 * pages call requireAccess() and server actions call authorize(), because middleware alone must
 * never be what stands between a visitor and private data. Role checks live there, not here.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() asks Supabase to validate the token. getSession() would only trust the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const level = getRequiredAccess(pathname);

  if (level !== "public") {
    if (!user) {
      // A leftover auth cookie with no valid user means the session expired or was revoked.
      const hadSession = request.cookies.getAll().some((cookie) => /^sb-.+-auth-token/.test(cookie.name));
      const params = new URLSearchParams({ next: `${pathname}${search}` });
      if (hadSession) params.set("reason", "expired");
      return redirectWithCookies(request, response, "/signin", `?${params.toString()}`);
    }
    // Private pages must never be stored by a browser or shared cache.
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}
