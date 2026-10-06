import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ReservationTable = Tables<"tables">;
export type Reservation = Tables<"reservations">;

/** Whether the restaurant has any bookable table configured yet (admin-managed). */
export async function hasReservableTables(restaurantId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tables")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true);

  if (error) {
    console.error("[data/reservation] hasReservableTables:", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export type CustomerReservation = Reservation & {
  dining_experiences: Pick<Tables<"dining_experiences">, "title" | "slug"> | null;
  tables: Pick<Tables<"tables">, "label" | "area"> | null;
  reservation_preferences: Pick<Tables<"reservation_preferences">, "preference">[];
};

/** A signed-in customer's own reservations, newest first. RLS already scopes
 * this to their own rows; the explicit filter here is defense in depth. */
export async function getCustomerReservations(customerId: string): Promise<CustomerReservation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "*, dining_experiences(title, slug), tables(label, area), reservation_preferences(preference)",
    )
    .eq("customer_id", customerId)
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false });

  if (error) {
    console.error("[data/reservation] getCustomerReservations:", error.message);
    return [];
  }
  return (data as CustomerReservation[] | null) ?? [];
}

export type AdminReservation = Reservation & {
  dining_experiences: Pick<Tables<"dining_experiences">, "id" | "title"> | null;
  tables: Pick<Tables<"tables">, "id" | "label" | "area" | "capacity"> | null;
  reservation_preferences: Pick<Tables<"reservation_preferences">, "preference">[];
  profiles: Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone"> | null;
};

const ADMIN_RESERVATION_SELECT =
  "*, dining_experiences(id, title), tables(id, label, area, capacity), reservation_preferences(preference), profiles(id, full_name, email, phone)";

export interface AdminReservationFilters {
  /** "YYYY-MM-DD". Omit for every date. */
  date?: string;
  status?: Tables<"reservations">["status"];
  /** Matches guest/contact name, email or phone (sanitized ILIKE). */
  search?: string;
}

function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()%_\\]/g, " ").trim().slice(0, 80);
}

export interface AdminReservationPage {
  reservations: AdminReservation[];
  total: number;
}

/** Reservations for the restaurant, most recent first, with the joins the
 * admin list and detail views need. Staff/admin only — RLS also enforces this.
 * `pagination` is optional: the "tonight" view fetches a single day unpaginated,
 * while the full reservations list (which can span the restaurant's entire
 * history once the date filter is cleared) pages through results. */
export async function getReservationsForAdmin(
  restaurantId: string,
  filters: AdminReservationFilters = {},
  pagination: { page?: number; pageSize?: number } = {},
): Promise<AdminReservationPage> {
  const supabase = await createClient();
  let query = supabase
    .from("reservations")
    .select(ADMIN_RESERVATION_SELECT, { count: "exact" })
    .eq("restaurant_id", restaurantId);

  if (filters.date) query = query.eq("reservation_date", filters.date);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search) {
    const term = sanitizeSearch(filters.search);
    if (term) {
      query = query.or(
        `contact_name.ilike.%${term}%,contact_email.ilike.%${term}%,contact_phone.ilike.%${term}%`,
      );
    }
  }

  query = query.order("reservation_date", { ascending: false }).order("reservation_time", { ascending: true });

  const { page, pageSize } = pagination;
  if (page && pageSize) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[data/reservation] getReservationsForAdmin:", error.message);
    return { reservations: [], total: 0 };
  }
  return { reservations: (data as AdminReservation[] | null) ?? [], total: count ?? 0 };
}

export interface TableStatusRow {
  table_id: string | null;
  status: Tables<"reservations">["status"];
}

/** Just enough to color the floor plan for one date — table id and status only,
 * unpaginated and none of the joins the full admin list carries. Kept separate
 * from `getReservationsForAdmin` so paginating that list can never leave the
 * floor plan showing only part of a busy date's bookings. */
export async function getReservationStatusesForDate(restaurantId: string, date: string): Promise<TableStatusRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("table_id, status")
    .eq("restaurant_id", restaurantId)
    .eq("reservation_date", date)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("[data/reservation] getReservationStatusesForDate:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getReservationByIdForAdmin(restaurantId: string, id: string): Promise<AdminReservation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(ADMIN_RESERVATION_SELECT)
    .eq("restaurant_id", restaurantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[data/reservation] getReservationByIdForAdmin:", error.message);
    return null;
  }
  return data as AdminReservation | null;
}

/** Every table (active or not), for the admin floor plan and the reservation edit form. */
export async function getAllTablesForAdmin(restaurantId: string): Promise<ReservationTable[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("area", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("[data/reservation] getAllTablesForAdmin:", error.message);
    return [];
  }
  return data ?? [];
}
