import "server-only";

import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/constants/reservation";

export interface OverviewStats {
  date: string;
  totalReservationsToday: number;
  activeReservationsToday: number;
  totalGuestsToday: number;
  tablesBookedToday: number;
  activeTableCount: number;
  occupancyPercent: number;
  occasionBreakdown: { occasion: string; count: number }[];
  experienceBreakdown: { title: string; count: number }[];
  recentActivity: {
    id: string;
    guestName: string;
    date: string;
    time: string;
    status: string;
    createdAt: string;
  }[];
  alerts: string[];
}

const ACTIVE_STATUSES = ["pending", "confirmed", "completed"] as const;

/** Everything the admin Overview page shows, computed from today's reservations
 * plus the most recent activity across all dates. Aggregated in application code
 * rather than SQL — the daily reservation volume this serves is small enough
 * that a dedicated view or RPC isn't worth the extra migration surface yet. */
export async function getOverviewStats(restaurantId: string, date = todayDateString()): Promise<OverviewStats> {
  const supabase = await createClient();

  const [todayRes, recentRes, tablesRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, status, guest_count, table_id, occasion, dining_experiences(title), profiles(full_name), contact_name")
      .eq("restaurant_id", restaurantId)
      .eq("reservation_date", date),
    supabase
      .from("reservations")
      .select("id, reservation_date, reservation_time, status, created_at, profiles(full_name), contact_name")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("tables").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).eq("is_active", true),
  ]);

  if (todayRes.error) console.error("[data/admin-overview] today reservations:", todayRes.error.message);
  if (recentRes.error) console.error("[data/admin-overview] recent activity:", recentRes.error.message);
  if (tablesRes.error) console.error("[data/admin-overview] active tables:", tablesRes.error.message);

  type TodayRow = {
    id: string;
    status: string;
    guest_count: number;
    table_id: string | null;
    occasion: string | null;
    dining_experiences: { title: string } | null;
    profiles: { full_name: string | null } | null;
    contact_name: string | null;
  };
  const today = (todayRes.data as TodayRow[] | null) ?? [];
  const activeToday = today.filter((r) => (ACTIVE_STATUSES as readonly string[]).includes(r.status));

  const occasionCounts = new Map<string, number>();
  const experienceCounts = new Map<string, number>();
  const bookedTables = new Set<string>();
  let totalGuestsToday = 0;

  for (const r of activeToday) {
    totalGuestsToday += r.guest_count ?? 0;
    if (r.table_id) bookedTables.add(r.table_id);
    if (r.occasion) occasionCounts.set(r.occasion, (occasionCounts.get(r.occasion) ?? 0) + 1);
    if (r.dining_experiences?.title) {
      const title = r.dining_experiences.title;
      experienceCounts.set(title, (experienceCounts.get(title) ?? 0) + 1);
    }
  }

  const activeTableCount = tablesRes.count ?? 0;
  const tablesBookedToday = bookedTables.size;
  const occupancyPercent = activeTableCount > 0 ? Math.round((tablesBookedToday / activeTableCount) * 100) : 0;

  type RecentRow = {
    id: string;
    reservation_date: string;
    reservation_time: string;
    status: string;
    created_at: string;
    profiles: { full_name: string | null } | null;
    contact_name: string | null;
  };
  const recentActivity = ((recentRes.data as RecentRow[] | null) ?? []).map((r) => ({
    id: r.id,
    guestName: r.profiles?.full_name ?? r.contact_name ?? "Guest",
    date: r.reservation_date,
    time: r.reservation_time,
    status: r.status,
    createdAt: r.created_at,
  }));

  const alerts: string[] = [];
  const pendingToday = activeToday.filter((r) => r.status === "pending").length;
  if (pendingToday > 0) alerts.push(`${pendingToday} reservation${pendingToday === 1 ? "" : "s"} today still awaiting confirmation.`);
  const unassignedToday = activeToday.filter((r) => r.status !== "completed" && !r.table_id).length;
  if (unassignedToday > 0) alerts.push(`${unassignedToday} reservation${unassignedToday === 1 ? "" : "s"} today have no table assigned.`);
  if (activeTableCount === 0) alerts.push("No active tables are configured yet — the reservation flow can't seat anyone.");

  return {
    date,
    totalReservationsToday: today.length,
    activeReservationsToday: activeToday.length,
    totalGuestsToday,
    tablesBookedToday,
    activeTableCount,
    occupancyPercent,
    occasionBreakdown: Array.from(occasionCounts, ([occasion, count]) => ({ occasion, count })).sort((a, b) => b.count - a.count),
    experienceBreakdown: Array.from(experienceCounts, ([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count),
    recentActivity,
    alerts,
  };
}
