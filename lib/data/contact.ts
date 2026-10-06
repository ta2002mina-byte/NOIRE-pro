import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ContactStatus } from "@/lib/validations/contact";

export type ContactMessage = Tables<"contact_messages">;

export async function getContactMessagesForAdmin(
  restaurantId: string,
  opts: { status?: ContactStatus; page: number; pageSize: number },
): Promise<{ messages: ContactMessage[]; total: number }> {
  const supabase = await createClient();
  const from = (opts.page - 1) * opts.pageSize;

  let query = supabase
    .from("contact_messages")
    .select("*", { count: "exact" })
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .range(from, from + opts.pageSize - 1);
  if (opts.status) query = query.eq("status", opts.status);

  const { data, count, error } = await query;
  if (error) {
    console.error("[data/contact] getContactMessagesForAdmin:", error.message);
    return { messages: [], total: 0 };
  }
  return { messages: data ?? [], total: count ?? 0 };
}

export async function getContactStatusCounts(restaurantId: string): Promise<Record<ContactStatus, number>> {
  const supabase = await createClient();
  const counts: Record<ContactStatus, number> = { new: 0, read: 0, replied: 0, archived: 0 };
  const { data, error } = await supabase.from("contact_messages").select("status").eq("restaurant_id", restaurantId).limit(5000);
  if (error) {
    console.error("[data/contact] getContactStatusCounts:", error.message);
    return counts;
  }
  for (const row of data ?? []) {
    if (row.status in counts) counts[row.status as ContactStatus] += 1;
  }
  return counts;
}
