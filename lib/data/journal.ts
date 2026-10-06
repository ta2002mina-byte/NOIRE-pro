import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type JournalEntry = Tables<"dining_journal"> & {
  menu_item: Pick<Tables<"menu_items">, "id" | "name" | "slug" | "image_url"> | null;
};

/**
 * A signed-in customer's own journal entries, newest visit first. RLS already
 * scopes this to their own rows (dining_journal has no staff-read policy);
 * the explicit filter here is defense in depth.
 */
export async function getCustomerJournalEntries(customerId: string): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dining_journal")
    .select("*, menu_item:menu_items(id, name, slug, image_url)")
    .eq("customer_id", customerId)
    .order("visited_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/journal] getCustomerJournalEntries:", error.message);
    return [];
  }
  return (data as JournalEntry[] | null) ?? [];
}

export interface DishOption {
  id: string;
  name: string;
}

/** Dishes a customer can attach a journal entry to. Includes dishes that are
 * no longer available, since a journal records what was actually tried. */
export async function getDishOptions(restaurantId: string): Promise<DishOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/journal] getDishOptions:", error.message);
    return [];
  }
  return data ?? [];
}
