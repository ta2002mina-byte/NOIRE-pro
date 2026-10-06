"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { gallerySchema } from "@/lib/validations/gallery";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Every route that reads gallery/space photos. */
function revalidateGalleryPaths() {
  revalidatePath("/admin/gallery");
  revalidatePath("/");
  revalidatePath("/space");
}

function readGalleryForm(formData: FormData) {
  return {
    imageUrl: readString(formData, "imageUrl"),
    altText: readString(formData, "altText"),
    caption: readString(formData, "caption"),
    space: readString(formData, "space"),
    sortOrder: readString(formData, "sortOrder") || "0",
    isActive: formData.get("isActive") === "on",
  };
}

function toEchoValues(raw: ReturnType<typeof readGalleryForm>): Record<string, string> {
  return {
    imageUrl: raw.imageUrl,
    altText: raw.altText,
    caption: raw.caption,
    space: raw.space,
    sortOrder: raw.sortOrder,
  };
}

export async function createGalleryImageAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readGalleryForm(formData);
  const parsed = gallerySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("gallery").insert({
    restaurant_id: restaurant.id,
    image_url: data.imageUrl,
    alt_text: data.altText,
    caption: data.caption,
    space: data.space,
    sort_order: data.sortOrder,
    is_active: data.isActive,
  });

  if (error) {
    console.error("[gallery] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that photo. Please try again.", values: toEchoValues(raw) };
  }

  revalidateGalleryPaths();
  return { status: "success", message: "Photo added." };
}

export async function updateGalleryImageAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readGalleryForm(formData);
  const parsed = gallerySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("gallery")
    .update({
      image_url: data.imageUrl,
      alt_text: data.altText,
      caption: data.caption,
      space: data.space,
      sort_order: data.sortOrder,
      is_active: data.isActive,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[gallery] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save your changes. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That photo no longer exists.", values: toEchoValues(raw) };
  }

  revalidateGalleryPaths();
  return { status: "success", message: "Photo updated." };
}

export async function deleteGalleryImageAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase.from("gallery").delete().eq("id", id).eq("restaurant_id", restaurant.id).select("id");

  if (error) {
    console.error("[gallery] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that photo." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That photo no longer exists." };

  revalidateGalleryPaths();
  return { ok: true };
}
