"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { isReviewStatus, reviewSchema, type ReviewStatus } from "@/lib/validations/review";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

function revalidateReviewPaths() {
  revalidatePath("/account/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/menu");
}

function readReviewForm(formData: FormData) {
  return {
    menuItemId: readString(formData, "menuItemId"),
    rating: readString(formData, "rating"),
    title: readString(formData, "title"),
    body: readString(formData, "body"),
  };
}

function toEchoValues(raw: ReturnType<typeof readReviewForm>): Record<string, string> {
  return raw;
}

/** Customers review the restaurant itself (menuItemId left blank) or one dish
 * they've tried. A new review always starts pending — the insert trigger enforces
 * this server-side regardless of what's posted here. */
export async function createReviewAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("user");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readReviewForm(formData);
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { error } = await auth.supabase.from("reviews").insert({
    customer_id: auth.ctx.user.id,
    restaurant_id: restaurant.id,
    menu_item_id: data.menuItemId,
    rating: data.rating,
    title: data.title,
    body: data.body,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { menuItemId: ["You’ve already reviewed this — edit your existing review instead."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[reviews] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save your review. Please try again.", values: toEchoValues(raw) };
  }

  revalidateReviewPaths();
  return { status: "success", message: "Thanks — your review has been submitted for approval." };
}

/** Customers may only change rating/title/body of their own review (the guard_owner_update
 * trigger enforces this even if this check is bypassed); which dish it's about can't change. */
export async function updateReviewAction(reviewId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("user");
  if (!auth.ok) return { status: "error", message: auth.message };

  const raw = readReviewForm(formData);
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("reviews")
    .update({ rating: data.rating, title: data.title, body: data.body })
    .eq("id", reviewId)
    .eq("customer_id", auth.ctx.user.id)
    .select("id");

  if (error) {
    console.error("[reviews] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save your changes. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That review couldn’t be found." };
  }

  revalidateReviewPaths();
  return { status: "success", message: "Review updated." };
}

/** Customers may only delete their own review — RLS enforces this even if this check is bypassed. */
export async function deleteReviewAction(reviewId: string): Promise<SimpleActionResult> {
  const auth = await authorize("user");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { data, error } = await auth.supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("customer_id", auth.ctx.user.id)
    .select("id");

  if (error) {
    console.error("[reviews] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that review. Please try again." };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "That review couldn’t be found." };
  }

  revalidateReviewPaths();
  return { ok: true };
}

/** Staff moderation: publish, hide, or send a review back to pending. */
export async function setReviewStatusAction(reviewId: string, status: ReviewStatus): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  if (!isReviewStatus(status)) return { ok: false, message: "That isn’t a valid review status." };

  const { data, error } = await auth.supabase.from("reviews").update({ status }).eq("id", reviewId).select("id");

  if (error) {
    console.error("[reviews] Status change failed:", error.message);
    return { ok: false, message: "We couldn’t update that review." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That review no longer exists." };

  revalidateReviewPaths();
  return { ok: true };
}

/** Staff may remove any review (spam, abuse, duplicates). */
export async function adminDeleteReviewAction(reviewId: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { data, error } = await auth.supabase.from("reviews").delete().eq("id", reviewId).select("id");

  if (error) {
    console.error("[reviews] Admin delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that review." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That review no longer exists." };

  revalidateReviewPaths();
  return { ok: true };
}
