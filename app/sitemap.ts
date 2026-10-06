import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/env";
import { getRestaurant } from "@/lib/data/restaurant";
import { getMenuItemSlugsForSitemap } from "@/lib/data/menu";

const STATIC_PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/menu", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/reserve", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/find-my-dish", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/chef", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/our-ingredients", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/space", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/stories", priority: 0.5, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" as const },
];

/** Public pages only — account, admin, and auth routes are private and excluded here and in robots.ts. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurant = await getRestaurant();
  const dishes = restaurant ? await getMenuItemSlugsForSitemap(restaurant.id) : [];

  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    priority: route.priority,
    changeFrequency: route.changeFrequency,
  }));

  const dishEntries: MetadataRoute.Sitemap = dishes.map((dish) => ({
    url: `${SITE_URL}/menu/${dish.slug}`,
    lastModified: dish.updated_at,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  return [...staticEntries, ...dishEntries];
}
