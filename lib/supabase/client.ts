"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Client Components. Carries the signed-in user's session
 * from cookies (set by the middleware), so Row Level Security applies exactly
 * as it does on the server — used here for direct-from-browser uploads to
 * Storage, which avoids routing image bytes through a Server Action.
 */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
