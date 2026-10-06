"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { chefNoteSchema, CHEF_NOTE_STATUSES, type ChefNoteStatus } from "@/lib/validations/chef-note";

/** Every route that reads chef_notes and must reflect a change immediately. */
function revalidateChefPaths() {
  revalidatePath("/admin/chef");
  revalidatePath("/chef");
  revalidatePath("/");
}

/** "YYYY-MM-DDTHH:mm" (local) from an ISO timestamp, for a datetime-local input's defaultValue. */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function readChefNoteForm(formData: FormData) {
  return {
    title: readString(formData, "title"),
    body: readString(formData, "body"),
    imageUrl: readString(formData, "imageUrl"),
    ingredientId: readString(formData, "ingredientId"),
    isFeatured: formData.get("isFeatured") === "on",
    status: readString(formData, "status") || "draft",
    publishAt: readString(formData, "publishAt"),
  };
}

function toEchoValues(raw: ReturnType<typeof readChefNoteForm>): Record<string, string> {
  return {
    title: raw.title,
    body: raw.body,
    imageUrl: raw.imageUrl,
    ingredientId: raw.ingredientId,
    status: raw.status,
    publishAt: raw.publishAt,
  };
}

export async function createChefNoteAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readChefNoteForm(formData);
  const parsed = chefNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("chef_notes").insert({
    restaurant_id: restaurant.id,
    author_id: auth.ctx.user.id,
    ingredient_id: data.ingredientId,
    title: data.title,
    body: data.body,
    image_url: data.imageUrl,
    is_featured: data.isFeatured,
    status: data.status,
    publish_at: data.publishAt,
  });

  if (error) {
    console.error("[chef] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that note. Please try again.", values: toEchoValues(raw) };
  }

  revalidateChefPaths();
  return { status: "success", message: `“${data.title}” was created.` };
}

export async function updateChefNoteAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readChefNoteForm(formData);
  const parsed = chefNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("chef_notes")
    .update({
      ingredient_id: data.ingredientId,
      title: data.title,
      body: data.body,
      image_url: data.imageUrl,
      is_featured: data.isFeatured,
      status: data.status,
      publish_at: data.publishAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[chef] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save that note. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That note no longer exists.", values: toEchoValues(raw) };
  }

  revalidateChefPaths();
  return { status: "success", message: `“${data.title}” was updated.` };
}

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Quick status transition from the list — no form. `clearSchedule` drops any
 * publish_at, used for "Publish now" (goes live immediately, not at the old scheduled time). */
export async function setChefNoteStatusAction(
  id: string,
  nextStatus: ChefNoteStatus,
  clearSchedule = false,
): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  if (!CHEF_NOTE_STATUSES.includes(nextStatus)) return { ok: false, message: "Not a valid status." };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("chef_notes")
    .update({
      status: nextStatus,
      publish_at: clearSchedule ? null : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[chef] Status change failed:", error.message);
    return { ok: false, message: "We couldn’t update that note." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That note no longer exists." };

  revalidateChefPaths();
  return { ok: true };
}

export async function deleteChefNoteAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("chef_notes")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[chef] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that note." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That note no longer exists." };

  revalidateChefPaths();
  return { ok: true };
}

export { toDatetimeLocalValue };
