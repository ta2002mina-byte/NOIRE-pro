import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ReviewStatus } from "@/lib/validations/review";

export type CustomerReview = Tables<"reviews"> & {
  menu_item: Pick<Tables<"menu_items">, "id" | "name" | "slug"> | null;
};

/**
 * A signed-in customer's own reviews, newest first — every status, since this
 * is their private list of what they've written (published, pending or hidden).
 */
export async function getCustomerReviews(customerId: string): Promise<CustomerReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, menu_item:menu_items(id, name, slug)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/reviews] getCustomerReviews:", error.message);
    return [];
  }
  return (data as CustomerReview[] | null) ?? [];
}

export type AdminReview = Tables<"reviews"> & {
  menu_item: Pick<Tables<"menu_items">, "id" | "name" | "slug"> | null;
  customer: Pick<Tables<"profiles">, "id" | "full_name" | "email"> | null;
};

export interface AdminReviewPage {
  reviews: AdminReview[];
  total: number;
  page: number;
  pageSize: number;
}

/** Paginated, status-filterable review queue for staff moderation. */
export async function getReviewsForAdmin(
  restaurantId: string,
  { status, page = 1, pageSize = 20 }: { status?: ReviewStatus; page?: number; pageSize?: number } = {},
): Promise<AdminReviewPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reviews")
    .select("*, menu_item:menu_items(id, name, slug), customer:profiles(id, full_name, email)", {
      count: "exact",
    })
    .eq("restaurant_id", restaurantId);

  if (status) query = query.eq("status", status);

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    console.error("[data/reviews] getReviewsForAdmin:", error.message);
    return { reviews: [], total: 0, page, pageSize };
  }

  return { reviews: (data as AdminReview[] | null) ?? [], total: count ?? 0, page, pageSize };
}

/** Counts per status, for the moderation queue's filter tabs. */
export async function getReviewStatusCounts(restaurantId: string): Promise<Record<ReviewStatus, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select("status").eq("restaurant_id", restaurantId);

  const counts: Record<ReviewStatus, number> = { pending: 0, published: 0, hidden: 0 };
  if (error) {
    console.error("[data/reviews] getReviewStatusCounts:", error.message);
    return counts;
  }
  for (const row of data ?? []) {
    if (row.status === "pending" || row.status === "published" || row.status === "hidden") {
      counts[row.status] += 1;
    }
  }
  return counts;
}

export type PublishedDishReview = Pick<
  Tables<"reviews">,
  "id" | "rating" | "title" | "body" | "is_verified_visit" | "created_at"
>;

/**
 * Approved reviews for one dish, newest first, for the public dish page. Reviewer
 * identity is deliberately not selected — public reviews are anonymous.
 *
 * `status = 'published'` is filtered explicitly: the RLS read policy also lets a
 * signed-in customer see their own pending/hidden reviews and staff see everything,
 * and none of those belong on a public page.
 */
export async function getPublishedDishReviews(menuItemId: string, limit = 20): Promise<PublishedDishReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, title, body, is_verified_visit, created_at")
    .eq("menu_item_id", menuItemId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/reviews] getPublishedDishReviews:", error.message);
    return [];
  }
  return data ?? [];
}
