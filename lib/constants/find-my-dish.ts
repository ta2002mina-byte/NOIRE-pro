/**
 * Constants for the "Find My Dish" quiz. Mood options are shared with the
 * menu's mood filter (see lib/constants/menu-filters.ts) so the two stay
 * in sync with the dish_preferences.mood check constraint.
 */

/** Sentinel value for an optional select left at "No preference". */
export const NO_PREFERENCE = "__any__";

export const HUNGER_LEVELS = [
  { value: "light", label: "Just a little something" },
  { value: "moderate", label: "Normally hungry" },
  { value: "hungry", label: "Pretty hungry" },
  { value: "very_hungry", label: "Very hungry" },
] as const;

export type HungerLevel = (typeof HUNGER_LEVELS)[number]["value"];

export function isHungerLevel(value: string | undefined | null): value is HungerLevel {
  return HUNGER_LEVELS.some((level) => level.value === value);
}

/** The exact spice level the customer wants, matching menu_items.spice_level (0–5). */
export const SPICE_LEVELS = [
  { value: 0, label: "No spice" },
  { value: 1, label: "Mild" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hot" },
  { value: 4, label: "Very hot" },
  { value: 5, label: "Extra hot" },
] as const;
