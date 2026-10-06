import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the links in Supabase emails (signup confirmation, password recovery).
 * Swaps the one-time `code` for a session cookie, then forwards to a validated `next` path.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next")) ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth] Code exchange failed:", error.message);
  }

  // Expired, reused, or opened in another browser: send people somewhere they can recover.
  const failurePath = next === "/reset-password" ? "/forgot-password" : "/signin";
  return NextResponse.redirect(new URL(`${failurePath}?error=auth_callback`, origin));
}
