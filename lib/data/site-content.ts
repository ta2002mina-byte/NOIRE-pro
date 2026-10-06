import "server-only";

import { cache } from "react";

import { getRestaurant } from "@/lib/data/restaurant";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type SiteContent = Tables<"site_content">;

/** The single site_content row for the restaurant, or null if nothing has been saved yet
 * (every consumer then falls back to the built-in defaults). Cached per request, so the
 * banner, hero and footer share one query. */
export const getSiteContent = cache(async (): Promise<SiteContent | null> => {
  const restaurant = await getRestaurant();
  if (!restaurant) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (error) {
    console.error("[data/site-content] getSiteContent:", error.message);
    return null;
  }
  return data;
});

/** Whether the announcement banner should show right now. */
export function isBannerLive(content: SiteContent | null, now: Date = new Date()): boolean {
  if (!content?.banner_enabled || !content.banner_message?.trim()) return false;
  if (content.banner_starts_at && new Date(content.banner_starts_at) > now) return false;
  if (content.banner_ends_at && new Date(content.banner_ends_at) <= now) return false;
  return true;
}
