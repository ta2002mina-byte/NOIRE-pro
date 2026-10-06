"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { storySchema } from "@/lib/validations/story";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Every route that reads restaurant_stories and must reflect a change immediately. */
function revalidateStoryPaths() {
  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  revalidatePath("/");
}

function readStoryForm(formData: FormData) {
  return {
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    mediaUrl: readString(formData, "mediaUrl"),
    storyType: readString(formData, "storyType") || "kitchen",
    publishedAt: readString(formData, "publishedAt"),
    expiresAt: readString(formData, "expiresAt"),
    isActive: formData.get("isActive") === "on",
  };
}

function toEchoValues(raw: ReturnType<typeof readStoryForm>): Record<string, string> {
  return {
    title: raw.title,
    description: raw.description,
    mediaUrl: raw.mediaUrl,
    storyType: raw.storyType,
    publishedAt: raw.publishedAt,
    expiresAt: raw.expiresAt,
  };
}

export async function createStoryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readStoryForm(formData);
  const parsed = storySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("restaurant_stories").insert({
    restaurant_id: restaurant.id,
    title: data.title,
    description: data.description,
    media_url: data.mediaUrl,
    story_type: data.storyType,
    published_at: data.publishedAt,
    expires_at: data.expiresAt,
    is_active: data.isActive,
  });

  if (error) {
    console.error("[stories] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that story. Please try again.", values: toEchoValues(raw) };
  }

  revalidateStoryPaths();
  return { status: "success", message: `“${data.title}” was created.` };
}

export async function updateStoryAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readStoryForm(formData);
  const parsed = storySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("restaurant_stories")
    .update({
      title: data.title,
      description: data.description,
      media_url: data.mediaUrl,
      story_type: data.storyType,
      published_at: data.publishedAt,
      expires_at: data.expiresAt,
      is_active: data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[stories] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save that story. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That story no longer exists.", values: toEchoValues(raw) };
  }

  revalidateStoryPaths();
  return { status: "success", message: `“${data.title}” was updated.` };
}

/** Quick "Publish now" from the list: activates and stamps published_at to this moment if it isn't set yet. */
export async function publishStoryNowAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data: existing, error: fetchError } = await auth.supabase
    .from("restaurant_stories")
    .select("published_at")
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (fetchError || !existing) return { ok: false, message: "That story no longer exists." };

  const now = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from("restaurant_stories")
    .update({ is_active: true, published_at: existing.published_at ?? now, updated_at: now })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[stories] Publish failed:", error.message);
    return { ok: false, message: "We couldn’t publish that story." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That story no longer exists." };

  revalidateStoryPaths();
  return { ok: true };
}

/** Quick unpublish — deactivates without deleting or losing the schedule. */
export async function unpublishStoryAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("restaurant_stories")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[stories] Unpublish failed:", error.message);
    return { ok: false, message: "We couldn’t unpublish that story." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That story no longer exists." };

  revalidateStoryPaths();
  return { ok: true };
}

export async function deleteStoryAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { data, error } = await auth.supabase
    .from("restaurant_stories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    console.error("[stories] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that story." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That story no longer exists." };

  revalidateStoryPaths();
  return { ok: true };
}
