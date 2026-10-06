/**
 * Single source of truth for the mood-based menu's filter vocabulary.
 * The `mood.value` strings must match the `dish_preferences.mood` check
 * constraint in supabase/migrations/20260920000200_noire_02_content.sql.
 */

export interface MoodFilterOption {
  /** URL-friendly value used in `?mood=`. */
  slug: string;
  /** Value stored in dish_preferences.mood. */
  value: "light" | "comfort" | "spicy" | "rich_creamy" | "chefs_choice" | "something_new";
  label: string;
}

export const MOOD_FILTERS: readonly MoodFilterOption[] = [
  { slug: "light", value: "light", label: "Something Light" },
  { slug: "comfort", value: "comfort", label: "Comfort Food" },
  { slug: "spicy", value: "spicy", label: "Spicy" },
  { slug: "rich-creamy", value: "rich_creamy", label: "Rich & Creamy" },
  { slug: "chefs-choice", value: "chefs_choice", label: "Chef’s Choice" },
  { slug: "new", value: "something_new", label: "Something New" },
];

export function getMoodBySlug(slug: string | undefined | null): MoodFilterOption | undefined {
  if (!slug) return undefined;
  return MOOD_FILTERS.find((mood) => mood.slug === slug);
}

export const DIET_FILTERS = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "non_vegetarian", label: "Non-vegetarian" },
] as const;

export type DietFilterValue = (typeof DIET_FILTERS)[number]["value"];

export function isDietFilterValue(value: string | undefined | null): value is DietFilterValue {
  return DIET_FILTERS.some((diet) => diet.value === value);
}

export const SPICE_FILTERS = [
  { value: "0", label: "No spice" },
  { value: "1", label: "Mild or below" },
  { value: "2", label: "Medium or below" },
  { value: "3", label: "Hot or below" },
  { value: "4", label: "Very hot or below" },
] as const;

/** Parses a `?spice=` query value into a 0–5 max spice level, or undefined if absent/invalid. */
export function parseMaxSpice(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) return undefined;
  return parsed;
}

export const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "spice-asc", label: "Spice (mild first)" },
  { value: "spice-desc", label: "Spice (hottest first)" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(value: string | undefined | null): value is SortValue {
  return SORT_OPTIONS.some((sort) => sort.value === value);
}
