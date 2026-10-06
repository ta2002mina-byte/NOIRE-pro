import "server-only";

import { isStoryLive } from "@/lib/data/visibility";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type RestaurantStory = Tables<"restaurant_stories">;

/**
 * Currently-live stories only: active, published, not yet expired.
 * The window is applied here as well as by RLS, because a signed-in staff
 * session can read every row and must still see the public version of the site.
 */
export async function getLiveStories(restaurantId: string): Promise<RestaurantStory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_stories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[data/stories] getLiveStories:", error.message);
    return [];
  }
  const now = new Date();
  return (data ?? []).filter((story) => isStoryLive(story, now));
}

/** Admin listing: every story regardless of status, newest edited first. */
export async function getAllStories(restaurantId: string): Promise<RestaurantStory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_stories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[data/stories] getAllStories:", error.message);
    return [];
  }
  return data ?? [];
}

/** A single story for the admin edit form. Null if it doesn't exist or belongs to another restaurant. */
export async function getStoryById(restaurantId: string, id: string): Promise<RestaurantStory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_stories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[data/stories] getStoryById:", error.message);
    return null;
  }
  return data;
}
