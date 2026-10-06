import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DietFilterValue, MoodFilterOption, SortValue } from "@/lib/constants/menu-filters";
import type { Tables } from "@/types/database";

export type Category = Tables<"categories">;
export type MenuItem = Tables<"menu_items">;
export type DishPreference = Tables<"dish_preferences">;

export interface MenuItemWithExtras extends MenuItem {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  dish_preferences: DishPreference[];
}

/** A dish plus the ingredients the kitchen has linked to it. */
export interface MenuItemDetail extends MenuItemWithExtras {
  menu_item_ingredients: { ingredient: { id: string; name: string; slug: string; is_active: boolean } | null }[];
}

const MENU_ITEM_SELECT =
  "*, category:categories(id, name, slug), dish_preferences(*)";

/** Same as MENU_ITEM_SELECT, but inner-joined to dish_preferences so a mood filter can be applied. */
const MENU_ITEM_SELECT_WITH_MOOD =
  "*, category:categories(id, name, slug), dish_preferences!inner(*)";

export interface MenuItemFilters {
  /** Mood value from dish_preferences.mood (see lib/constants/menu-filters). */
  mood?: MoodFilterOption["value"];
  /** Free-text search across dish name and description. */
  search?: string;
  diet?: DietFilterValue;
  /** Only dishes at or below this spice level (0–5). */
  maxSpice?: number;
  sort?: SortValue;
}

/**
 * Strips characters that are meaningful to PostgREST's `.or()` filter syntax
 * (commas and parentheses) and escapes ILIKE wildcards, so free-text search
 * input can never be used to inject an unintended filter.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()]/g, " ")
    .trim()
    .slice(0, 80)
    .replace(/[%_\\]/g, (match) => `\\${match}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySort(query: any, sort: SortValue | undefined) {
  switch (sort) {
    case "name-asc":
      return query.order("name", { ascending: true });
    case "name-desc":
      return query.order("name", { ascending: false });
    case "price-asc":
      return query.order("price", { ascending: true });
    case "price-desc":
      return query.order("price", { ascending: false });
    case "spice-asc":
      return query.order("spice_level", { ascending: true }).order("name", { ascending: true });
    case "spice-desc":
      return query.order("spice_level", { ascending: false }).order("name", { ascending: true });
    default:
      return query.order("sort_order", { ascending: true }).order("name", { ascending: true });
  }
}

/** Active categories for a restaurant, in display order. */
export async function getCategories(restaurantId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/menu] getCategories:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Menu items for the restaurant, optionally narrowed by mood, search,
 * diet, or spice level, and sorted per `filters.sort`. Includes
 * unavailable dishes — RLS already scopes visibility, and unavailable
 * dishes stay visible but not orderable (never silently hidden).
 */
export async function getMenuItems(
  restaurantId: string,
  filters: MenuItemFilters = {},
): Promise<MenuItemWithExtras[]> {
  const supabase = await createClient();
  const select = filters.mood ? MENU_ITEM_SELECT_WITH_MOOD : MENU_ITEM_SELECT;

  let query = supabase.from("menu_items").select(select).eq("restaurant_id", restaurantId);

  if (filters.mood) {
    query = query.eq("dish_preferences.mood", filters.mood);
  }
  if (filters.diet) {
    query = query.eq("diet_type", filters.diet);
  }
  if (typeof filters.maxSpice === "number") {
    query = query.lte("spice_level", filters.maxSpice);
  }
  if (filters.search) {
    const term = sanitizeSearchTerm(filters.search);
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  query = applySort(query, filters.sort);

  const { data, error } = await query;

  if (error) {
    console.error("[data/menu] getMenuItems:", error.message);
    return [];
  }
  return (data as MenuItemWithExtras[]) ?? [];
}

export async function getFeaturedDishes(restaurantId: string, limit = 6): Promise<MenuItemWithExtras[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_ITEM_SELECT)
    .eq("restaurant_id", restaurantId)
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[data/menu] getFeaturedDishes:", error.message);
    return [];
  }
  return (data as MenuItemWithExtras[]) ?? [];
}

/** Just enough to build the sitemap — every dish that has its own public page. */
export async function getMenuItemSlugsForSitemap(
  restaurantId: string,
): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("slug, updated_at")
    .eq("restaurant_id", restaurantId)
    .eq("is_available", true);

  if (error) {
    console.error("[data/menu] getMenuItemSlugsForSitemap:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getMenuItemBySlug(restaurantId: string, slug: string): Promise<MenuItemDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(`${MENU_ITEM_SELECT}, menu_item_ingredients(ingredient:ingredients(id, name, slug, is_active))`)
    .eq("restaurant_id", restaurantId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[data/menu] getMenuItemBySlug:", error.message);
    return null;
  }
  return data as unknown as MenuItemDetail | null;
}

export interface MenuItemOption {
  id: string;
  name: string;
  is_available: boolean;
}

/** Lightweight list for pickers (the ingredients admin's "used in dishes" checklist). */
export async function getMenuItemOptions(restaurantId: string): Promise<MenuItemOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, is_available")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/menu] getMenuItemOptions:", error.message);
    return [];
  }
  return data ?? [];
}

// ---------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------

const ADMIN_MENU_ITEM_SELECT =
  "*, category:categories(id, name, slug), dish_preferences(*), menu_item_ingredients(ingredient:ingredients(id, name, slug, is_active))";

export interface AdminMenuItem extends MenuItem {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  dish_preferences: DishPreference[];
  menu_item_ingredients: { ingredient: { id: string; name: string; slug: string; is_active: boolean } | null }[];
}

/** Every category regardless of status, for the admin dish form's dropdown. */
export async function getAllCategories(restaurantId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/menu] getAllCategories:", error.message);
    return [];
  }
  return data ?? [];
}

/** Admin listing: every dish regardless of availability, newest edited first. */
export async function getAllMenuItemsForAdmin(restaurantId: string): Promise<AdminMenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(ADMIN_MENU_ITEM_SELECT)
    .eq("restaurant_id", restaurantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[data/menu] getAllMenuItemsForAdmin:", error.message);
    return [];
  }
  return (data as unknown as AdminMenuItem[]) ?? [];
}

/** A single dish for the admin edit form. Null if it doesn't exist or belongs to another restaurant. */
export async function getMenuItemByIdForAdmin(restaurantId: string, id: string): Promise<AdminMenuItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(ADMIN_MENU_ITEM_SELECT)
    .eq("restaurant_id", restaurantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[data/menu] getMenuItemByIdForAdmin:", error.message);
    return null;
  }
  return data as unknown as AdminMenuItem | null;
}

/** The ingredient ids currently linked to this dish — for pre-checking the ingredient picker. */
export async function getLinkedIngredientIds(menuItemId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_item_ingredients")
    .select("ingredient_id")
    .eq("menu_item_id", menuItemId);

  if (error) {
    console.error("[data/menu] getLinkedIngredientIds:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.ingredient_id);
}
