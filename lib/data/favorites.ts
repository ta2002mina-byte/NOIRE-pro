import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type FavoriteMenuItem = Pick<
  Tables<"menu_items">,
  "id" | "name" | "slug" | "image_url" | "price" | "is_available"
>;

export interface FavoriteEntry {
  id: string;
  createdAt: string;
  menuItem: FavoriteMenuItem | null;
}

/**
 * A signed-in customer's own saved dishes, most recently saved first. RLS
 * already scopes favorites to their own rows; this filter is defense in depth.
 */
export async function getCustomerFavorites(customerId: string): Promise<FavoriteEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("id, created_at, menu_item:menu_items(id, name, slug, image_url, price, is_available)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/favorites] getCustomerFavorites:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    menuItem: (row.menu_item as FavoriteMenuItem | null) ?? null,
  }));
}

/** Whether the given customer has already saved this dish — used to render the toggle correctly on load. */
export async function isMenuItemFavorited(customerId: string, menuItemId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("customer_id", customerId)
    .eq("menu_item_id", menuItemId)
    .maybeSingle();

  if (error) {
    console.error("[data/favorites] isMenuItemFavorited:", error.message);
    return false;
  }
  return Boolean(data);
}
