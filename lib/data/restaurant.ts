import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Restaurant = Tables<"restaurants">;

/**
 * The restaurant this site presents. NOIRÉ is single-tenant on the public
 * site (see supabase/README.md: "Create the restaurant row first"), so this
 * reads the one active restaurant rather than taking a slug. Cached per
 * request so every section of the homepage shares one query.
 */
export const getRestaurant = cache(async (): Promise<Restaurant | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[data/restaurant] getRestaurant:", error.message);
    return null;
  }
  return data;
});

/**
 * The restaurant row for the admin settings screen. Unlike `getRestaurant`, this
 * does not filter on `is_active`: staff RLS (`restaurants_staff_all`) lets admins
 * read an inactive restaurant, and settings must still be able to load and
 * re-activate it instead of treating it as "no restaurant yet".
 */
export const getRestaurantForAdmin = cache(async (): Promise<Restaurant | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[data/restaurant] getRestaurantForAdmin:", error.message);
    return null;
  }
  return data;
});

/** Parses `restaurants.opening_hours` (freeform admin-entered JSON) into an
 * ordered list of day/hours lines. Returns [] for any shape it doesn't
 * recognise instead of guessing — never fabricate hours. */
export function parseOpeningHours(value: Restaurant["opening_hours"]): { day: string; hours: string }[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  const order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0,
  );
  if (entries.length === 0) return [];

  entries.sort(([a], [b]) => {
    const ai = order.indexOf(a.toLowerCase());
    const bi = order.indexOf(b.toLowerCase());
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return entries.map(([day, hours]) => ({
    day: day.length > 1 ? day[0].toUpperCase() + day.slice(1) : day.toUpperCase(),
    hours,
  }));
}

/** A short "City, Region" style line from the address fields that are set. */
export function formatLocationLine(restaurant: Pick<Restaurant, "city" | "region" | "country">): string | null {
  const parts = [restaurant.city, restaurant.region, restaurant.country].filter(
    (v): v is string => Boolean(v && v.trim()),
  );
  return parts.length ? parts.join(", ") : null;
}
