import "server-only";

import { headers } from "next/headers";

/**
 * Static site origin for metadata that can't (or shouldn't) depend on the
 * incoming request — `metadataBase`, canonical URLs, sitemap.xml, robots.txt,
 * JSON-LD. Same source root layout has always used for `metadataBase`.
 * For links inside transactional emails, use `getSiteUrl()` below instead —
 * it also falls back to the request's own host, which matters when
 * NEXT_PUBLIC_SITE_URL isn't set.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

/**
 * The public origin of the site, used inside confirmation and password-reset emails.
 * Prefer NEXT_PUBLIC_SITE_URL; otherwise fall back to the incoming request's host.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
