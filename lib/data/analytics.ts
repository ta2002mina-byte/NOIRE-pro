import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isStoryLive } from "@/lib/data/visibility";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";
import { SPICE_LEVELS } from "@/lib/constants/find-my-dish";
import { occasionLabel, todayDateString } from "@/lib/constants/reservation";
import { STORY_TYPE_LABELS, labelFor } from "@/lib/constants/labels";
import { getAnalyticsRangeDef, type AnalyticsRangeValue } from "@/lib/constants/analytics";

export type { AnalyticsRangeValue } from "@/lib/constants/analytics";
export { ANALYTICS_RANGES, isAnalyticsRange } from "@/lib/constants/analytics";

/**
 * Analytics is read-only reporting over data other phases already collect.
 * Nothing here invents a metric NOIRÉ doesn't actually track: there is no
 * page-view or funnel log, so "engagement" and "conversion" are reported only
 * where a real, stored signal supports them (see the comments on each field).
 */

/** "YYYY-MM-DD" cutoff for date columns (reservation_date, dining_history.visit_date). Null means no lower bound. */
function rangeStartDate(range: AnalyticsRangeValue): string | null {
  const def = getAnalyticsRangeDef(range);
  if (def.days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - (def.days - 1));
  return d.toISOString().slice(0, 10);
}

/** ISO timestamp cutoff for timestamptz columns (created_at, visited_at, published_at). Null means no lower bound. */
function rangeStartTimestamp(range: AnalyticsRangeValue): string | null {
  const startDate = rangeStartDate(range);
  return startDate ? `${startDate}T00:00:00.000Z` : null;
}

function pctOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10; // one decimal place
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

function topCounts<T>(counts: Map<T, number>, limit: number): { key: T; count: number }[] {
  return Array.from(counts, ([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function bump<T>(map: Map<T, number>, key: T, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

/** Statuses that represent a real, realized booking rather than one that never happened. */
const ACTIVE_RESERVATION_STATUSES = new Set(["pending", "confirmed", "completed"]);

export interface AnalyticsSnapshot {
  range: AnalyticsRangeValue;
  rangeLabel: string;
  generatedAt: string;

  reservations: {
    total: number;
    activeTotal: number;
    totalGuests: number;
    cancellationRatePercent: number;
    noShowRatePercent: number;
    /** Share of active reservations that picked a curated experience — the closest real signal to "conversion" this app tracks. */
    experienceConversionPercent: number;
    /** Daily counts, most recent 30 days of the selected range (all-time is bounded the same way to keep the chart readable). */
    dailyVolume: { date: string; count: number }[];
  };

  occasions: { occasion: string; label: string; count: number }[];
  experiences: { title: string; count: number }[];

  tables: {
    activeTableCount: number;
    daysMeasured: number;
    averageOccupancyPercent: number;
  };

  visits: {
    totalVisits: number;
    distinctCustomers: number;
    repeatCustomers: number;
    repeatRatePercent: number;
  };

  dishes: {
    /** Dishes actually dined and journaled in the period. */
    mostJournaled: { name: string; count: number }[];
    /** Dishes added to favorites in the period. */
    mostFavorited: { name: string; count: number }[];
  };

  journal: {
    totalEntries: number;
    ratedEntries: number;
    averageRating: number | null;
  };

  taste: {
    profilesSaved: number;
    moods: { value: string; label: string; count: number }[];
    spiceLevels: { level: number; label: string; count: number }[];
    flavors: { value: string; count: number }[];
    textures: { value: string; count: number }[];
  };

  stories: {
    liveNow: number;
    publishedInRange: number;
    byType: { type: string; label: string; count: number }[];
  };
}

/** Everything the admin Analytics page shows. Aggregated in application code from a handful of
 * batched queries, the same approach as lib/data/admin-overview.ts — a dedicated SQL view or RPC
 * isn't worth the extra migration surface at NOIRÉ's data volume. */
export async function getAnalyticsSnapshot(restaurantId: string, range: AnalyticsRangeValue): Promise<AnalyticsSnapshot> {
  const supabase = await createClient();
  const startDate = rangeStartDate(range);
  const startTimestamp = rangeStartTimestamp(range);
  const today = todayDateString();

  let reservationsQuery = supabase
    .from("reservations")
    .select("id, status, guest_count, table_id, occasion, experience_id, reservation_date, dining_experiences(title)")
    .eq("restaurant_id", restaurantId);
  if (startDate) reservationsQuery = reservationsQuery.gte("reservation_date", startDate);

  let historyQuery = supabase
    .from("dining_history")
    .select("id, customer_id, visit_date")
    .eq("restaurant_id", restaurantId);
  if (startDate) historyQuery = historyQuery.gte("visit_date", startDate);

  // dining_journal, favorites and taste_profiles have no restaurant_id column — NOIRÉ is
  // single-tenant on the customer side too (see lib/data/restaurant.ts), so every row belongs
  // to this restaurant's customers and no extra filter is needed.
  let journalQuery = supabase.from("dining_journal").select("id, menu_item_id, rating, visited_at, menu_items(name)");
  if (startTimestamp) journalQuery = journalQuery.gte("visited_at", startTimestamp);

  let favoritesQuery = supabase.from("favorites").select("id, menu_item_id, created_at, menu_items(name)");
  if (startTimestamp) favoritesQuery = favoritesQuery.gte("created_at", startTimestamp);

  const [reservationsRes, historyRes, journalRes, favoritesRes, tasteRes, storiesRes, tablesRes] = await Promise.all([
    reservationsQuery,
    historyQuery,
    journalQuery,
    favoritesQuery,
    supabase.from("taste_profiles").select("preferred_moods, spice_preference, flavor_preferences, texture_preferences"),
    supabase
      .from("restaurant_stories")
      .select("id, is_active, published_at, expires_at, story_type")
      .eq("restaurant_id", restaurantId),
    supabase.from("tables").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).eq("is_active", true),
  ]);

  for (const [label, res] of [
    ["reservations", reservationsRes],
    ["dining_history", historyRes],
    ["dining_journal", journalRes],
    ["favorites", favoritesRes],
    ["taste_profiles", tasteRes],
    ["restaurant_stories", storiesRes],
    ["tables", tablesRes],
  ] as const) {
    if (res.error) console.error(`[data/analytics] ${label}:`, res.error.message);
  }

  // ---- Reservations ----------------------------------------------------
  type ReservationRow = {
    id: string;
    status: string;
    guest_count: number;
    table_id: string | null;
    occasion: string | null;
    experience_id: string | null;
    reservation_date: string;
    dining_experiences: { title: string } | null;
  };
  const reservations = (reservationsRes.data as ReservationRow[] | null) ?? [];
  const activeReservations = reservations.filter((r) => ACTIVE_RESERVATION_STATUSES.has(r.status));

  const total = reservations.length;
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;
  const noShow = reservations.filter((r) => r.status === "no_show").length;
  const withExperience = activeReservations.filter((r) => r.experience_id !== null).length;
  const totalGuests = activeReservations.reduce((sum, r) => sum + (r.guest_count ?? 0), 0);

  const occasionCounts = new Map<string, number>();
  const experienceCounts = new Map<string, number>();
  const byDate = new Map<string, number>();
  const tablesByDate = new Map<string, Set<string>>();

  for (const r of reservations) {
    bump(byDate, r.reservation_date);
  }
  for (const r of activeReservations) {
    if (r.occasion) bump(occasionCounts, r.occasion);
    if (r.dining_experiences?.title) bump(experienceCounts, r.dining_experiences.title);
    if (r.table_id) {
      const set = tablesByDate.get(r.reservation_date) ?? new Set<string>();
      set.add(r.table_id);
      tablesByDate.set(r.reservation_date, set);
    }
  }

  const dailyVolume = Array.from(byDate, ([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-30);

  // ---- Table utilization -------------------------------------------------
  const activeTableCount = tablesRes.count ?? 0;
  const daysMeasured = tablesByDate.size; // days that actually had at least one booking in range
  const averageOccupancyPercent =
    activeTableCount > 0 && daysMeasured > 0
      ? Math.round(
          (Array.from(tablesByDate.values()).reduce((sum, set) => sum + set.size, 0) / (activeTableCount * daysMeasured)) * 1000,
        ) / 10
      : 0;

  // ---- Visits (verified, from dining_history) ----------------------------
  type HistoryRow = { id: string; customer_id: string; visit_date: string };
  const history = (historyRes.data as HistoryRow[] | null) ?? [];
  const visitsByCustomer = new Map<string, number>();
  for (const v of history) bump(visitsByCustomer, v.customer_id);
  const distinctCustomers = visitsByCustomer.size;
  const repeatCustomers = Array.from(visitsByCustomer.values()).filter((count) => count >= 2).length;

  // ---- Dishes -------------------------------------------------------------
  type JournalRow = { id: string; menu_item_id: string | null; rating: number | null; visited_at: string; menu_items: { name: string } | null };
  const journal = (journalRes.data as JournalRow[] | null) ?? [];
  const journalCounts = new Map<string, number>();
  const ratings: number[] = [];
  for (const j of journal) {
    if (j.menu_items?.name) bump(journalCounts, j.menu_items.name);
    if (typeof j.rating === "number") ratings.push(j.rating);
  }

  type FavoriteRow = { id: string; menu_item_id: string; created_at: string; menu_items: { name: string } | null };
  const favorites = (favoritesRes.data as FavoriteRow[] | null) ?? [];
  const favoriteCounts = new Map<string, number>();
  for (const f of favorites) {
    if (f.menu_items?.name) bump(favoriteCounts, f.menu_items.name);
  }

  // ---- Taste analytics (from saved taste profiles — a current snapshot per
  // customer, not a per-quiz event log, so this reflects who has SAVED a
  // profile, not every quiz run). ------------------------------------------
  type TasteRow = {
    preferred_moods: string[];
    spice_preference: number | null;
    flavor_preferences: string[];
    texture_preferences: string[];
  };
  const tasteProfiles = (tasteRes.data as TasteRow[] | null) ?? [];
  const moodCounts = new Map<string, number>();
  const spiceCounts = new Map<number, number>();
  const flavorCounts = new Map<string, number>();
  const textureCounts = new Map<string, number>();
  for (const t of tasteProfiles) {
    for (const mood of t.preferred_moods ?? []) bump(moodCounts, mood);
    if (typeof t.spice_preference === "number") bump(spiceCounts, t.spice_preference);
    for (const flavor of t.flavor_preferences ?? []) bump(flavorCounts, flavor);
    for (const texture of t.texture_preferences ?? []) bump(textureCounts, texture);
  }

  // ---- Stories --------------------------------------------------------------
  type StoryRow = { id: string; is_active: boolean; published_at: string | null; expires_at: string | null; story_type: string };
  const stories = (storiesRes.data as StoryRow[] | null) ?? [];
  const now = new Date();
  const liveNow = stories.filter((s) => isStoryLive(s, now)).length;
  const publishedInRangeRows = stories.filter((s) => {
    if (!s.published_at) return false;
    if (new Date(s.published_at).getTime() > now.getTime()) return false;
    if (startTimestamp && s.published_at < startTimestamp) return false;
    return true;
  });
  const storyTypeCounts = new Map<string, number>();
  for (const s of publishedInRangeRows) bump(storyTypeCounts, s.story_type);

  const def = getAnalyticsRangeDef(range);

  return {
    range,
    rangeLabel: def.label,
    generatedAt: today,

    reservations: {
      total,
      activeTotal: activeReservations.length,
      totalGuests,
      cancellationRatePercent: pctOf(cancelled, total),
      noShowRatePercent: pctOf(noShow, total),
      experienceConversionPercent: pctOf(withExperience, activeReservations.length),
      dailyVolume,
    },

    occasions: topCounts(occasionCounts, 8).map(({ key, count }) => ({ occasion: key, label: occasionLabel(key) ?? key, count })),
    experiences: topCounts(experienceCounts, 8).map(({ key, count }) => ({ title: key, count })),

    tables: { activeTableCount, daysMeasured, averageOccupancyPercent },

    visits: {
      totalVisits: history.length,
      distinctCustomers,
      repeatCustomers,
      repeatRatePercent: pctOf(repeatCustomers, distinctCustomers),
    },

    dishes: {
      mostJournaled: topCounts(journalCounts, 6).map(({ key, count }) => ({ name: key, count })),
      mostFavorited: topCounts(favoriteCounts, 6).map(({ key, count }) => ({ name: key, count })),
    },

    journal: {
      totalEntries: journal.length,
      ratedEntries: ratings.length,
      averageRating: average(ratings),
    },

    taste: {
      profilesSaved: tasteProfiles.length,
      moods: topCounts(moodCounts, 8).map(({ key, count }) => ({
        value: key,
        label: MOOD_FILTERS.find((m) => m.value === key)?.label ?? labelFor({}, key),
        count,
      })),
      spiceLevels: topCounts(spiceCounts, 6).map(({ key, count }) => ({
        level: key,
        label: SPICE_LEVELS.find((s) => s.value === key)?.label ?? `Level ${key}`,
        count,
      })),
      flavors: topCounts(flavorCounts, 8).map(({ key, count }) => ({ value: labelFor({}, key), count })),
      textures: topCounts(textureCounts, 8).map(({ key, count }) => ({ value: labelFor({}, key), count })),
    },

    stories: {
      liveNow,
      publishedInRange: publishedInRangeRows.length,
      byType: topCounts(storyTypeCounts, 8).map(({ key, count }) => ({ type: key, label: labelFor(STORY_TYPE_LABELS, key), count })),
    },
  };
}
