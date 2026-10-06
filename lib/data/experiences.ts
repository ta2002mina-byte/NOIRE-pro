import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type DiningExperience = Tables<"dining_experiences">;

export async function getActiveExperiences(restaurantId: string): Promise<DiningExperience[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dining_experiences")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    console.error("[data/experiences] getActiveExperiences:", error.message);
    return [];
  }
  return data ?? [];
}

/** Admin listing: every experience regardless of status, for management. */
export async function getAllExperiences(restaurantId: string): Promise<DiningExperience[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dining_experiences")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    console.error("[data/experiences] getAllExperiences:", error.message);
    return [];
  }
  return data ?? [];
}

/** A single experience for the admin edit form. Null if it doesn't exist or belongs to another restaurant. */
export async function getExperienceById(restaurantId: string, id: string): Promise<DiningExperience | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dining_experiences")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[data/experiences] getExperienceById:", error.message);
    return null;
  }
  return data;
}

/** How many upcoming (pending/confirmed) reservations reference this experience — shown before delete. */
export async function countUpcomingReservationsForExperience(experienceId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("experience_id", experienceId)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("[data/experiences] countUpcomingReservationsForExperience:", error.message);
    return 0;
  }
  return count ?? 0;
}
