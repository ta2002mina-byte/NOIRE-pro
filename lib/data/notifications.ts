import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CustomerNotification = Tables<"notifications">;

/** Newest first. RLS already limits rows to the signed-in customer; the explicit
 * filter keeps the query index-friendly and the intent obvious. */
export async function getCustomerNotifications(customerId: string, limit = 50): Promise<CustomerNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/notifications] getCustomerNotifications:", error.message);
    return [];
  }
  return data ?? [];
}
