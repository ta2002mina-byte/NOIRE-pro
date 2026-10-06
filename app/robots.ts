import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/env";

/** Account, admin, and auth routes are private (auth-gated and/or user-specific) —
 * disallowed here in addition to their own `noindex` route metadata, since a
 * crawler that ignores meta robots may still respect robots.txt. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/auth"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
