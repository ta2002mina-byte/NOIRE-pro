import type { HungerLevel } from "@/lib/constants/find-my-dish";
import { NO_PREFERENCE } from "@/lib/constants/find-my-dish";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";
import type { MenuItemWithExtras } from "@/lib/data/menu";

export interface QuizAnswers {
  mood: (typeof MOOD_FILTERS)[number]["value"];
  hunger: HungerLevel;
  spice: number; // 0–5, exact preference
  flavor?: string;
  texture?: string;
  mealType?: string;
  occasion?: string;
}

export interface DishFacets {
  flavors: string[];
  textures: string[];
  mealTypes: string[];
  occasions: string[];
}

/** Distinct, restaurant-entered flavor/texture/meal-type/occasion values actually on the menu tonight — never a fabricated fixed list. */
export function extractDishFacets(items: MenuItemWithExtras[]): DishFacets {
  const flavors = new Set<string>();
  const textures = new Set<string>();
  const mealTypes = new Set<string>();
  const occasions = new Set<string>();

  for (const item of items) {
    for (const pref of item.dish_preferences) {
      if (pref.flavor) flavors.add(pref.flavor);
      if (pref.texture) textures.add(pref.texture);
      if (pref.meal_type) mealTypes.add(pref.meal_type);
      if (pref.occasion) occasions.add(pref.occasion);
    }
  }

  const sortAlpha = (values: Set<string>) => Array.from(values).sort((a, b) => a.localeCompare(b));
  return {
    flavors: sortAlpha(flavors),
    textures: sortAlpha(textures),
    mealTypes: sortAlpha(mealTypes),
    occasions: sortAlpha(occasions),
  };
}

export interface ScoredDish {
  dish: MenuItemWithExtras;
  score: number;
  reasons: string[];
}

export type MatchResult = { matched: true; dish: MenuItemWithExtras; reasons: string[] } | { matched: false };

/**
 * A pluggable matcher. `ruleBasedMatch` below is the only implementation today;
 * a future AI-backed strategy can implement the same interface and be swapped
 * in (e.g. behind a feature flag) without touching callers.
 */
export interface MatchStrategy {
  id: string;
  match(items: MenuItemWithExtras[], answers: QuizAnswers): MatchResult;
}

const HEARTY_MOODS = new Set<QuizAnswers["mood"]>(["comfort", "rich_creamy", "chefs_choice"]);
const MOOD_LABELS = new Map(MOOD_FILTERS.map((mood) => [mood.value, mood.label]));

function scoreDish(dish: MenuItemWithExtras, answers: QuizAnswers): ScoredDish {
  let score = 0;
  const reasons: string[] = [];

  // Mood: the strongest signal. Take the best-matching preference row on this dish.
  const moodMatch = dish.dish_preferences.some((pref) => pref.mood === answers.mood);
  if (moodMatch) {
    score += 40;
    reasons.push(`Matches your mood for ${MOOD_LABELS.get(answers.mood)?.toLowerCase() ?? "tonight"}`);
  }

  // Spice: closeness to the exact level the customer picked, using the dish's own spice_level.
  const spiceDiff = Math.abs(dish.spice_level - answers.spice);
  if (spiceDiff === 0) {
    score += 25;
    reasons.push("Spice level matches what you asked for");
  } else if (spiceDiff === 1) {
    score += 12;
    reasons.push("Close to your spice preference");
  }

  // Flavor / texture: compared case-insensitively against the restaurant's own dish_preferences rows.
  if (answers.flavor && answers.flavor !== NO_PREFERENCE) {
    const flavorMatch = dish.dish_preferences.some(
      (pref) => pref.flavor?.toLowerCase() === answers.flavor?.toLowerCase(),
    );
    if (flavorMatch) {
      score += 15;
      reasons.push(`Flavor profile: ${answers.flavor}`);
    }
  }
  if (answers.texture && answers.texture !== NO_PREFERENCE) {
    const textureMatch = dish.dish_preferences.some(
      (pref) => pref.texture?.toLowerCase() === answers.texture?.toLowerCase(),
    );
    if (textureMatch) {
      score += 15;
      reasons.push(`Texture: ${answers.texture}`);
    }
  }

  // Optional: meal type and occasion.
  if (answers.mealType && answers.mealType !== NO_PREFERENCE) {
    const mealTypeMatch = dish.dish_preferences.some(
      (pref) => pref.meal_type?.toLowerCase() === answers.mealType?.toLowerCase(),
    );
    if (mealTypeMatch) {
      score += 10;
      reasons.push(`Great for ${answers.mealType.toLowerCase()}`);
    }
  }
  if (answers.occasion && answers.occasion !== NO_PREFERENCE) {
    const occasionMatch = dish.dish_preferences.some(
      (pref) => pref.occasion?.toLowerCase() === answers.occasion?.toLowerCase(),
    );
    if (occasionMatch) {
      score += 10;
      reasons.push(`A good fit for ${answers.occasion.toLowerCase()}`);
    }
  }

  // Hunger: a soft nudge, not a restaurant fact — lighter dishes for a light appetite,
  // heartier moods (comfort / rich & creamy / chef's choice) for a very hungry guest.
  if (answers.hunger === "light" && dish.dish_preferences.some((pref) => pref.mood === "light")) {
    score += 5;
    reasons.push("A lighter dish for a lighter appetite");
  }
  if (answers.hunger === "very_hungry" && dish.dish_preferences.some((pref) => HEARTY_MOODS.has(pref.mood as QuizAnswers["mood"]))) {
    score += 5;
    reasons.push("Hearty enough for a big appetite");
  }

  // Chef's Choice dishes get a small, transparent nudge — never enough to override taste matches.
  if (dish.is_chef_choice) {
    score += 2;
  }

  return { dish, score, reasons };
}

/**
 * Deterministic tie-break so the same answers always produce the same result:
 * higher score first, then the menu's own display order, then name.
 */
function compareScoredDishes(a: ScoredDish, b: ScoredDish): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.dish.sort_order !== b.dish.sort_order) return a.dish.sort_order - b.dish.sort_order;
  return a.dish.name.localeCompare(b.dish.name);
}

export const ruleBasedMatch: MatchStrategy = {
  id: "rule-based-v1",
  match(items, answers) {
    // Only dishes actually available tonight are eligible — never recommend something the
    // guest can't have, and never trust a client-provided list of "available" dishes.
    const candidates = items.filter((item) => item.is_available);
    if (candidates.length === 0) return { matched: false };

    const scored = candidates.map((dish) => scoreDish(dish, answers)).sort(compareScoredDishes);
    const best = scored[0];

    // Require at least a mood match or a close spice match — otherwise it's not a real match.
    if (!best || best.score < 12) return { matched: false };

    return { matched: true, dish: best.dish, reasons: best.reasons };
  },
};

export function findDishMatch(
  items: MenuItemWithExtras[],
  answers: QuizAnswers,
  strategy: MatchStrategy = ruleBasedMatch,
): MatchResult {
  return strategy.match(items, answers);
}
