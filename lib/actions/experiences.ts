"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { experienceSchema } from "@/lib/validations/experience";
import { slugify } from "@/lib/utils/slug";

/** Every route that reads dining_experiences and must reflect a change immediately. */
function revalidateExperiencePaths() {
  revalidatePath("/admin/experiences");
  revalidatePath("/");
  revalidatePath("/reserve");
}

function readExperienceForm(formData: FormData) {
  const title = readString(formData, "title");
  const rawSlug = readString(formData, "slug").trim();
  return {
    title,
    // An empty slug field derives one from the title so staff never have to think about it.
    slug: (rawSlug || slugify(title)).toLowerCase(),
    description: readString(formData, "description"),
    imageUrl: readString(formData, "imageUrl"),
    minGuests: readString(formData, "minGuests"),
    maxGuests: readString(formData, "maxGuests"),
    availableAreas: formData.getAll("availableAreas").filter((v): v is string => typeof v === "string"),
    preparationNotes: readString(formData, "preparationNotes"),
    sortOrder: readString(formData, "sortOrder") || "0",
    isActive: formData.get("isActive") === "on",
  };
}

/** Values echoed back into the form on a validation error (booleans/arrays need their own keys — FormState.values is strings only). */
function toEchoValues(raw: ReturnType<typeof readExperienceForm>): Record<string, string> {
  return {
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    imageUrl: raw.imageUrl,
    minGuests: raw.minGuests,
    maxGuests: raw.maxGuests,
    preparationNotes: raw.preparationNotes,
    sortOrder: raw.sortOrder,
  };
}

export async function createExperienceAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readExperienceForm(formData);
  const parsed = experienceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("dining_experiences").insert({
    restaurant_id: restaurant.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    image_url: data.imageUrl,
    min_guests: data.minGuests,
    max_guests: data.maxGuests,
    available_areas: data.availableAreas,
    preparation_notes: data.preparationNotes,
    sort_order: data.sortOrder,
    is_active: data.isActive,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: ["An experience with this slug already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[experiences] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that experience. Please try again.", values: toEchoValues(raw) };
  }

  revalidateExperiencePaths();
  return { status: "success", message: `“${data.title}” was created.` };
}

export async function updateExperienceAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readExperienceForm(formData);
  const parsed = experienceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("dining_experiences")
    .update({
      title: data.title,
      slug: data.slug,
      description: data.description,
      image_url: data.imageUrl,
      min_guests: data.minGuests,
      max_guests: data.maxGuests,
      available_areas: data.availableAreas,
      preparation_notes: data.preparationNotes,
      sort_order: data.sortOrder,
      is_active: data.isActive,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { slug: ["An experience with this slug already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[experiences] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save that experience. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That experience no longer exists.", values: toEchoValues(raw) };
  }

  revalidateExperiencePaths();
  return { status: "success", message: `“${data.title}” was updated.` };
}

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Quick active/inactive toggle from the list — no form, just a button. */
export async function toggleExperienceActiveAction(id: string, nextActive: boolean): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("dining_experiences")
    .update({ is_active: nextActive })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[experiences] Toggle failed:", error.message);
    return { ok: false, message: "We couldn’t update that experience." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That experience no longer exists." };

  revalidateExperiencePaths();
  return { ok: true };
}

/**
 * Deleting an experience never touches its reservations: experience_id is
 * "on delete set null", so past and upcoming bookings keep their table, date
 * and time — they just stop being tied to a named experience.
 */
export async function deleteExperienceAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("dining_experiences")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[experiences] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that experience." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That experience no longer exists." };

  revalidateExperiencePaths();
  return { ok: true };
}
