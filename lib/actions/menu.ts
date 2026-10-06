"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { dishPreferenceSchema, menuItemSchema } from "@/lib/validations/menu-item";
import { slugify } from "@/lib/utils/slug";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Every route that reads menu_items and must reflect a change immediately. */
function revalidateMenuPaths() {
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
  revalidatePath("/find-my-dish");
}

function readMenuItemForm(formData: FormData) {
  const name = readString(formData, "name");
  const rawSlug = readString(formData, "slug").trim();
  return {
    name,
    slug: (rawSlug || slugify(name)).toLowerCase(),
    categoryId: readString(formData, "categoryId"),
    description: readString(formData, "description"),
    story: readString(formData, "story"),
    chefNote: readString(formData, "chefNote"),
    price: readString(formData, "price"),
    imageUrl: readString(formData, "imageUrl"),
    spiceLevel: readString(formData, "spiceLevel") || "0",
    dietType: readString(formData, "dietType"),
    dietaryTags: readString(formData, "dietaryTags"),
    caloriesKcal: readString(formData, "caloriesKcal"),
    proteinG: readString(formData, "proteinG"),
    carbsG: readString(formData, "carbsG"),
    fatG: readString(formData, "fatG"),
    isFeatured: formData.get("isFeatured") === "on",
    isChefChoice: formData.get("isChefChoice") === "on",
    isAvailable: formData.get("isAvailable") === "on",
    sortOrder: readString(formData, "sortOrder") || "0",
  };
}

function toEchoValues(raw: ReturnType<typeof readMenuItemForm>): Record<string, string> {
  return {
    name: raw.name,
    slug: raw.slug,
    categoryId: raw.categoryId,
    description: raw.description,
    story: raw.story,
    chefNote: raw.chefNote,
    price: raw.price,
    imageUrl: raw.imageUrl,
    spiceLevel: raw.spiceLevel,
    dietType: raw.dietType,
    dietaryTags: raw.dietaryTags,
    caloriesKcal: raw.caloriesKcal,
    proteinG: raw.proteinG,
    carbsG: raw.carbsG,
    fatG: raw.fatG,
    sortOrder: raw.sortOrder,
  };
}

/** Four optional numbers → the nutrition jsonb shape, or null if none were entered. */
function toNutrition(data: {
  caloriesKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}): Record<string, number> | null {
  const entries = Object.entries({
    calories_kcal: data.caloriesKcal,
    protein_g: data.proteinG,
    carbs_g: data.carbsG,
    fat_g: data.fatG,
  }).filter(([, value]) => value !== null) as [string, number][];
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export async function createMenuItemAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readMenuItemForm(formData);
  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: inserted, error } = await auth.supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurant.id,
      category_id: data.categoryId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      story: data.story,
      chef_note: data.chefNote,
      price: data.price,
      image_url: data.imageUrl,
      spice_level: data.spiceLevel,
      diet_type: data.dietType,
      dietary_tags: data.dietaryTags,
      nutrition: toNutrition(data),
      is_featured: data.isFeatured,
      is_chef_choice: data.isChefChoice,
      is_available: data.isAvailable,
      sort_order: data.sortOrder,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: ["A dish with this slug already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[menu] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that dish. Please try again.", values: toEchoValues(raw) };
  }

  revalidateMenuPaths();
  return { status: "success", message: `“${data.name}” was created. Add ingredients and recommendation attributes below.` };
}

export async function updateMenuItemAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readMenuItemForm(formData);
  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("menu_items")
    .update({
      category_id: data.categoryId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      story: data.story,
      chef_note: data.chefNote,
      price: data.price,
      image_url: data.imageUrl,
      spice_level: data.spiceLevel,
      diet_type: data.dietType,
      dietary_tags: data.dietaryTags,
      nutrition: toNutrition(data),
      is_featured: data.isFeatured,
      is_chef_choice: data.isChefChoice,
      is_available: data.isAvailable,
      sort_order: data.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: ["A dish with this slug already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[menu] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save that dish. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That dish no longer exists.", values: toEchoValues(raw) };
  }

  revalidateMenuPaths();
  return { status: "success", message: `“${data.name}” was updated.` };
}

export async function deleteMenuItemAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[menu] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that dish. It may still be referenced by past orders or favorites." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That dish no longer exists." };

  revalidateMenuPaths();
  return { ok: true };
}

export async function toggleMenuItemAvailableAction(id: string, nextAvailable: boolean): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("menu_items")
    .update({ is_available: nextAvailable, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[menu] Availability toggle failed:", error.message);
    return { ok: false, message: "We couldn’t update that dish." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That dish no longer exists." };

  revalidateMenuPaths();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Ingredient links (menu_item_ingredients) — the whole set is replaced on
// each save, mirroring setIngredientDishLinksAction from the other side.
// ---------------------------------------------------------------------

export async function setMenuItemIngredientLinksAction(menuItemId: string, ingredientIds: string[]): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { error: deleteError } = await auth.supabase
    .from("menu_item_ingredients")
    .delete()
    .eq("menu_item_id", menuItemId);
  if (deleteError) {
    console.error("[menu] Clearing ingredient links failed:", deleteError.message);
    return { ok: false, message: "We couldn’t update the linked ingredients." };
  }

  if (ingredientIds.length > 0) {
    const { error: insertError } = await auth.supabase
      .from("menu_item_ingredients")
      .insert(ingredientIds.map((ingredientId) => ({ menu_item_id: menuItemId, ingredient_id: ingredientId })));
    if (insertError) {
      console.error("[menu] Linking ingredients failed:", insertError.message);
      return { ok: false, message: "We couldn’t update the linked ingredients." };
    }
  }

  revalidateMenuPaths();
  revalidatePath("/our-ingredients");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Recommendation attributes (dish_preferences) — replaced as a single row
// per save; see the note on dishPreferenceSchema.
// ---------------------------------------------------------------------

export async function setDishPreferenceAction(menuItemId: string, formData: FormData): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const raw = {
    mood: readString(formData, "mood"),
    flavor: readString(formData, "flavor"),
    texture: readString(formData, "texture"),
    mealType: readString(formData, "mealType"),
    occasion: readString(formData, "occasion"),
    spiceLevel: readString(formData, "prefSpiceLevel"),
  };
  const parsed = dishPreferenceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Check the recommendation attribute fields." };
  }

  const { error: deleteError } = await auth.supabase.from("dish_preferences").delete().eq("menu_item_id", menuItemId);
  if (deleteError) {
    console.error("[menu] Clearing dish preference failed:", deleteError.message);
    return { ok: false, message: "We couldn’t update recommendation attributes." };
  }

  const { data } = parsed;
  const hasAnyValue = data.mood || data.flavor || data.texture || data.mealType || data.occasion || data.spiceLevel !== null;
  if (hasAnyValue) {
    const { error: insertError } = await auth.supabase.from("dish_preferences").insert({
      menu_item_id: menuItemId,
      mood: data.mood,
      flavor: data.flavor,
      texture: data.texture,
      meal_type: data.mealType,
      occasion: data.occasion,
      spice_level: data.spiceLevel,
    });
    if (insertError) {
      console.error("[menu] Setting dish preference failed:", insertError.message);
      return { ok: false, message: "We couldn’t update recommendation attributes." };
    }
  }

  revalidateMenuPaths();
  revalidatePath("/find-my-dish");
  return { ok: true };
}
