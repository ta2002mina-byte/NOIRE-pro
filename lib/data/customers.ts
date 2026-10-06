import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

export interface AdminCustomerSummary {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  visits_count: number;
  dishes_explored_count: number;
}

export interface AdminCustomerPage {
  customers: AdminCustomerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()%_\\]/g, " ").trim().slice(0, 80);
}

/** Paginated, searchable customer list for the admin area. Profiles have no
 * restaurant_id — NOIRÉ is single-tenant, so every customer belongs to the one
 * restaurant — but their passport stats do, so that join is still scoped. */
export async function getCustomersForAdmin(
  restaurantId: string,
  { search = "", page = 1, pageSize = 20 }: { search?: string; page?: number; pageSize?: number } = {},
): Promise<AdminCustomerPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at", { count: "exact" })
    .eq("role", "customer");

  const term = sanitizeSearch(search);
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  query = query.order("full_name", { ascending: true, nullsFirst: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    console.error("[data/customers] getCustomersForAdmin:", error.message);
    return { customers: [], total: 0, page, pageSize };
  }

  const ids = (data ?? []).map((p) => p.id);
  const passportByCustomer = new Map<string, { visits_count: number; dishes_explored_count: number }>();
  if (ids.length > 0) {
    const { data: passports, error: passportError } = await supabase
      .from("dining_passports")
      .select("customer_id, visits_count, dishes_explored_count")
      .in("customer_id", ids);
    if (passportError) {
      console.error("[data/customers] passport lookup:", passportError.message);
    } else {
      for (const p of passports ?? []) {
        passportByCustomer.set(p.customer_id, { visits_count: p.visits_count, dishes_explored_count: p.dishes_explored_count });
      }
    }
  }

  const customers: AdminCustomerSummary[] = (data ?? []).map((profile) => ({
    ...profile,
    visits_count: passportByCustomer.get(profile.id)?.visits_count ?? 0,
    dishes_explored_count: passportByCustomer.get(profile.id)?.dishes_explored_count ?? 0,
  }));

  // restaurantId is accepted for symmetry with every other admin data function
  // and in case NOIRÉ becomes multi-tenant later; unused while single-tenant.
  void restaurantId;

  return { customers, total: count ?? 0, page, pageSize };
}

export interface CustomerDetail {
  profile: Profile;
  visits: { id: string; visit_date: string; guest_count: number | null; experience_title: string | null }[];
  dishesTried: { id: string; name: string; slug: string; visited_at: string; rating: number | null }[];
  favorites: { id: string; name: string; slug: string }[];
  reviews: { id: string; rating: number; title: string | null; body: string | null; status: string; created_at: string; dish_name: string | null }[];
  favoriteExperience: string | null;
  lastVisitDate: string | null;
}

/** Everything the admin customer detail page shows: visits, dishes tried, favorites,
 * reviews, last visit and favorite experience. Staff-only — RLS also enforces this. */
export async function getCustomerDetail(restaurantId: string, customerId: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();
  if (profileError || !profile) {
    if (profileError) console.error("[data/customers] profile lookup:", profileError.message);
    return null;
  }

  const [historyRes, journalRes, favoritesRes, reviewsRes] = await Promise.all([
    supabase
      .from("dining_history")
      .select("id, visit_date, guest_count, dining_experiences(title)")
      .eq("customer_id", customerId)
      .eq("restaurant_id", restaurantId)
      .order("visit_date", { ascending: false }),
    supabase
      .from("dining_journal")
      .select("id, visited_at, rating, menu_items(id, name, slug)")
      .eq("customer_id", customerId)
      .order("visited_at", { ascending: false })
      .limit(50),
    supabase
      .from("favorites")
      .select("id, menu_items(id, name, slug)")
      .eq("customer_id", customerId),
    supabase
      .from("reviews")
      .select("id, rating, title, body, status, created_at, menu_items(name)")
      .eq("customer_id", customerId)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false }),
  ]);

  if (historyRes.error) console.error("[data/customers] history:", historyRes.error.message);
  if (journalRes.error) console.error("[data/customers] journal:", journalRes.error.message);
  if (favoritesRes.error) console.error("[data/customers] favorites:", favoritesRes.error.message);
  if (reviewsRes.error) console.error("[data/customers] reviews:", reviewsRes.error.message);

  type HistoryRow = { id: string; visit_date: string; guest_count: number | null; dining_experiences: { title: string } | null };
  const history = (historyRes.data as HistoryRow[] | null) ?? [];

  type JournalRow = { id: string; visited_at: string; rating: number | null; menu_items: { id: string; name: string; slug: string } | null };
  const journal = (journalRes.data as JournalRow[] | null) ?? [];

  type FavoriteRow = { id: string; menu_items: { id: string; name: string; slug: string } | null };
  const favorites = (favoritesRes.data as FavoriteRow[] | null) ?? [];

  type ReviewRow = {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    status: string;
    created_at: string;
    menu_items: { name: string } | null;
  };
  const reviews = (reviewsRes.data as ReviewRow[] | null) ?? [];

  // Favorite experience: the most frequent one in this customer's verified visit history.
  const experienceCounts = new Map<string, number>();
  for (const visit of history) {
    const title = visit.dining_experiences?.title;
    if (title) experienceCounts.set(title, (experienceCounts.get(title) ?? 0) + 1);
  }
  let favoriteExperience: string | null = null;
  let bestCount = 0;
  for (const [title, n] of experienceCounts) {
    if (n > bestCount) {
      favoriteExperience = title;
      bestCount = n;
    }
  }

  return {
    profile,
    visits: history.map((h) => ({
      id: h.id,
      visit_date: h.visit_date,
      guest_count: h.guest_count,
      experience_title: h.dining_experiences?.title ?? null,
    })),
    dishesTried: journal
      .filter((j) => j.menu_items)
      .map((j) => ({ id: j.menu_items!.id, name: j.menu_items!.name, slug: j.menu_items!.slug, visited_at: j.visited_at, rating: j.rating })),
    favorites: favorites.filter((f) => f.menu_items).map((f) => ({ id: f.menu_items!.id, name: f.menu_items!.name, slug: f.menu_items!.slug })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      created_at: r.created_at,
      dish_name: r.menu_items?.name ?? null,
    })),
    favoriteExperience,
    lastVisitDate: history[0]?.visit_date ?? null,
  };
}
