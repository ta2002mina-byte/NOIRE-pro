"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { ingredientSchema } from "@/lib/validations/ingredient";
import { ingredientSourceSchema } from "@/lib/validations/ingredient-source";
import { slugify } from "@/lib/utils/slug";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };
export type SimpleActionResultWithId = { ok: true; id: string } | { ok: false; message: string };

/** Every route that reads ingredients/sourcing and must reflect a change immediately. */
function revalidateIngredientPaths() {
  revalidatePath("/admin/ingredients");
  revalidatePath("/our-ingredients");
}

// ---------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------

function readIngredientForm(formData: FormData) {
  const name = readString(formData, "name");
  const rawSlug = readString(formData, "slug").trim();
  return {
    name,
    slug: (rawSlug || slugify(name)).toLowerCase(),
    description: readString(formData, "description"),
    imageUrl: readString(formData, "imageUrl"),
    season: readString(formData, "season"),
    isActive: formData.get("isActive") === "on",
  };
}

function toEchoValues(raw: ReturnType<typeof readIngredientForm>): Record<string, string> {
  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    imageUrl: raw.imageUrl,
    season: raw.season,
  };
}

export async function createIngredientAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readIngredientForm(formData);
  const parsed = ingredientSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("ingredients").insert({
    restaurant_id: restaurant.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image_url: data.imageUrl,
    season: data.season,
    is_active: data.isActive,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: ["An ingredient with this slug already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[ingredients] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that ingredient. Please try again.", values: toEchoValues(raw) };
  }

  revalidateIngredientPaths();
  return { status: "success", message: `“${data.name}” was created. Add sourcing and linked dishes from the ingredient list.` };
}

export async function updateIngredientAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readIngredientForm(formData);
  const parsed = ingredientSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("ingredients")
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description,
      image_url: data.imageUrl,
      season: data.season,
      is_active: data.isActive,
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
        fieldErrors: { slug: ["An ingredient with this slug already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[ingredients] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save that ingredient. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That ingredient no longer exists.", values: toEchoValues(raw) };
  }

  revalidateIngredientPaths();
  return { status: "success", message: `“${data.name}” was updated.` };
}

/** Deleting an ingredient cascades to its sources and dish links (see schema:
 * both reference ingredients with on delete cascade) — a chef note that mentions
 * it keeps the note, since chef_notes.ingredient_id is on delete set null. */
export async function deleteIngredientAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("ingredients")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[ingredients] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that ingredient." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That ingredient no longer exists." };

  revalidateIngredientPaths();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Sourcing entries (belong to one ingredient)
// ---------------------------------------------------------------------

function readSourceForm(formData: FormData) {
  return {
    sourceName: readString(formData, "sourceName"),
    sourceType: readString(formData, "sourceType"),
    location: readString(formData, "location"),
    seasonStartMonth: readString(formData, "seasonStartMonth"),
    seasonEndMonth: readString(formData, "seasonEndMonth"),
    harvestDate: readString(formData, "harvestDate"),
    notes: readString(formData, "notes"),
    isPublished: formData.get("isPublished") === "on",
  };
}

export async function createIngredientSourceAction(
  ingredientId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const raw = readSourceForm(formData);
  const parsed = ingredientSourceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("ingredient_sources").insert({
    ingredient_id: ingredientId,
    source_name: data.sourceName,
    source_type: data.sourceType,
    location: data.location,
    season_start_month: data.seasonStartMonth,
    season_end_month: data.seasonEndMonth,
    harvest_date: data.harvestDate,
    notes: data.notes,
    is_published: data.isPublished,
  });

  if (error) {
    console.error("[ingredients] Create source failed:", error.message);
    return { status: "error", message: "We couldn’t save that source. Please try again." };
  }

  revalidateIngredientPaths();
  return { status: "success", message: `“${data.sourceName}” was added.` };
}

export async function updateIngredientSourceAction(
  sourceId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const raw = readSourceForm(formData);
  const parsed = ingredientSourceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("ingredient_sources")
    .update({
      source_name: data.sourceName,
      source_type: data.sourceType,
      location: data.location,
      season_start_month: data.seasonStartMonth,
      season_end_month: data.seasonEndMonth,
      harvest_date: data.harvestDate,
      notes: data.notes,
      is_published: data.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .select("id");

  if (error) {
    console.error("[ingredients] Update source failed:", error.message);
    return { status: "error", message: "We couldn’t save that source. Please try again." };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That source no longer exists." };
  }

  revalidateIngredientPaths();
  return { status: "success", message: `“${data.sourceName}” was updated.` };
}

/** Quick publish/unpublish toggle from the sources list — no form. */
export async function toggleSourcePublishedAction(sourceId: string, nextPublished: boolean): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { data, error } = await auth.supabase
    .from("ingredient_sources")
    .update({ is_published: nextPublished, updated_at: new Date().toISOString() })
    .eq("id", sourceId)
    .select("id");

  if (error) {
    console.error("[ingredients] Toggle source failed:", error.message);
    return { ok: false, message: "We couldn’t update that source." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That source no longer exists." };

  revalidateIngredientPaths();
  return { ok: true };
}

export async function deleteIngredientSourceAction(sourceId: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { data, error } = await auth.supabase.from("ingredient_sources").delete().eq("id", sourceId).select("id");

  if (error) {
    console.error("[ingredients] Delete source failed:", error.message);
    return { ok: false, message: "We couldn’t delete that source." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That source no longer exists." };

  revalidateIngredientPaths();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Dish relationships (menu_item_ingredients) — the whole set is replaced
// on each save, which keeps the form a simple checklist rather than a
// separate add/remove flow for every dish.
// ---------------------------------------------------------------------

export async function setIngredientDishLinksAction(
  ingredientId: string,
  menuItemIds: string[],
): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { error: deleteError } = await auth.supabase
    .from("menu_item_ingredients")
    .delete()
    .eq("ingredient_id", ingredientId);
  if (deleteError) {
    console.error("[ingredients] Clearing dish links failed:", deleteError.message);
    return { ok: false, message: "We couldn’t update the linked dishes." };
  }

  if (menuItemIds.length > 0) {
    const { error: insertError } = await auth.supabase
      .from("menu_item_ingredients")
      .insert(menuItemIds.map((menuItemId) => ({ ingredient_id: ingredientId, menu_item_id: menuItemId })));
    if (insertError) {
      console.error("[ingredients] Linking dishes failed:", insertError.message);
      return { ok: false, message: "We couldn’t update the linked dishes." };
    }
  }

  revalidateIngredientPaths();
  return { ok: true };
}
