import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminTable = Tables<"tables">;

/** All tables (active and inactive) for the admin tables screen, in a stable order. */
export async function getTablesForAdmin(restaurantId: string): Promise<AdminTable[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("area", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("[data/tables] getTablesForAdmin:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getTableByIdForAdmin(restaurantId: string, id: string): Promise<AdminTable | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) {
    console.error("[data/tables] getTableByIdForAdmin:", error.message);
    return null;
  }
  return data;
}
