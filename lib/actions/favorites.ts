"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Every route that shows a saved/unsaved state for a dish. */
function revalidateFavoritePaths(slug?: string) {
  revalidatePath("/account/favorites");
  if (slug) revalidatePath(`/menu/${slug}`);
}

/**
 * Saves or un-saves a dish for the signed-in customer. Identity comes from the
 * validated session, never from the form — the menu item id is the only thing
 * the client controls, and RLS still enforces customer_id = auth.uid() underneath.
 */
export async function setFavoriteAction(menuItemId: string, favorited: boolean, slug?: string): Promise<SimpleActionResult> {
  const auth = await authorize("user");
  if (!auth.ok) return { ok: false, message: auth.message };

  if (favorited) {
    const { error } = await auth.supabase
      .from("favorites")
      .insert({ customer_id: auth.ctx.user.id, menu_item_id: menuItemId });
    // 23505 = already saved (e.g. a second click before the UI updated) — not an error worth surfacing.
    if (error && error.code !== "23505") {
      console.error("[favorites] Save failed:", error.message);
      return { ok: false, message: "We couldn’t save that dish. Please try again." };
    }
  } else {
    const { error } = await auth.supabase
      .from("favorites")
      .delete()
      .eq("customer_id", auth.ctx.user.id)
      .eq("menu_item_id", menuItemId);
    if (error) {
      console.error("[favorites] Remove failed:", error.message);
      return { ok: false, message: "We couldn’t remove that dish. Please try again." };
    }
  }

  revalidateFavoritePaths(slug);
  return { ok: true };
}
