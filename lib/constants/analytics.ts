/** Date-range vocabulary for the admin Analytics page (lib/data/analytics.ts,
 * components/admin/analytics-range-filter.tsx). Kept separate from the (server-only)
 * data layer so it can be imported by plain UI components too. */

export const ANALYTICS_RANGES = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export type AnalyticsRangeValue = (typeof ANALYTICS_RANGES)[number]["value"];

export function isAnalyticsRange(value: string | undefined | null): value is AnalyticsRangeValue {
  return ANALYTICS_RANGES.some((r) => r.value === value);
}

export function getAnalyticsRangeDef(range: AnalyticsRangeValue) {
  return ANALYTICS_RANGES.find((r) => r.value === range) ?? ANALYTICS_RANGES[1];
}
