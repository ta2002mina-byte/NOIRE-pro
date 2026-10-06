import "server-only";

import { onlyPublishedSources } from "@/lib/data/visibility";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Ingredient = Tables<"ingredients">;
export type IngredientSource = Tables<"ingredient_sources">;

export interface IngredientWithSourcing extends Ingredient {
  ingredient_sources: IngredientSource[];
  dishes: { id: string; name: string; slug: string }[];
}

export interface IngredientOption {
  id: string;
  name: string;
  is_active: boolean;
}

/** Lightweight list for pickers (chef note's "related ingredient" field) — every
 * ingredient, active or not, so a note already linked to a retired one still shows it. */
export async function getIngredientOptions(restaurantId: string): Promise<IngredientOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("id, name, is_active")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/ingredients] getIngredientOptions:", error.message);
    return [];
  }
  return data ?? [];
}

/** Admin listing: every ingredient regardless of active status, with every source
 * (published or not) and linked dishes, for management. */
export async function getAllIngredientsForAdmin(restaurantId: string): Promise<IngredientWithSourcing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select(
      "*, ingredient_sources(*), menu_item_ingredients(menu_item:menu_items(id, name, slug, is_available))",
    )
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/ingredients] getAllIngredientsForAdmin:", error.message);
    return [];
  }

  type Row = Ingredient & {
    ingredient_sources: IngredientSource[];
    menu_item_ingredients: { menu_item: { id: string; name: string; slug: string; is_available: boolean } | null }[];
  };

  return ((data as Row[]) ?? []).map((row) => ({
    ...row,
    ingredient_sources: [...row.ingredient_sources].sort((a, b) => a.source_name.localeCompare(b.source_name)),
    dishes: row.menu_item_ingredients
      .map((mi) => mi.menu_item)
      .filter((d): d is { id: string; name: string; slug: string; is_available: boolean } => d !== null)
      .map(({ id, name, slug }) => ({ id, name, slug })),
  }));
}

/** A single ingredient (every source, active or not) for the admin edit page. */
export async function getIngredientByIdForAdmin(
  restaurantId: string,
  id: string,
): Promise<IngredientWithSourcing | null> {
  const all = await getAllIngredientsForAdmin(restaurantId);
  return all.find((i) => i.id === id) ?? null;
}

/** The ids of dishes currently linked to this ingredient — for pre-checking the dish picker. */
export async function getLinkedMenuItemIds(ingredientId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_item_ingredients")
    .select("menu_item_id")
    .eq("ingredient_id", ingredientId);

  if (error) {
    console.error("[data/ingredients] getLinkedMenuItemIds:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.menu_item_id);
}
/**
 * Active ingredients with their published sourcing info and the dishes
 * that use them. Only ever returns admin-entered facts — no supplier,
 * farm, or provenance text is invented here.
 */
export async function getIngredientsWithSourcing(restaurantId: string): Promise<IngredientWithSourcing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select(
      "*, ingredient_sources(*), menu_item_ingredients(menu_item:menu_items(id, name, slug, is_available))",
    )
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/ingredients] getIngredientsWithSourcing:", error.message);
    return [];
  }

  type Row = Ingredient & {
    ingredient_sources: IngredientSource[];
    menu_item_ingredients: { menu_item: { id: string; name: string; slug: string; is_available: boolean } | null }[];
  };

  return ((data as Row[]) ?? []).map((row) => ({
    ...row,
    // Nothing about a source is public until an admin publishes it (also true for staff sessions).
    ingredient_sources: onlyPublishedSources(row.ingredient_sources),
    dishes: row.menu_item_ingredients
      .map((mi) => mi.menu_item)
      .filter((d): d is { id: string; name: string; slug: string; is_available: boolean } => d !== null)
      .map(({ id, name, slug }) => ({ id, name, slug })),
  }));
}
