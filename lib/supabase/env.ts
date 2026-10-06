/**
 * Public Supabase settings only. The service-role key is deliberately not read here:
 * nothing that can be bundled for the browser may ever touch it.
 * (The literal `process.env.NEXT_PUBLIC_*` form is required so Next.js can inline the values.)
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.example to .env.local, set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.",
    );
  }
  return { url, anonKey };
}
