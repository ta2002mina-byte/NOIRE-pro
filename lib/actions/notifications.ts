"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Customers can only change `read_at` on their own notifications — the
 * guard_owner_update trigger and RLS enforce this even if these checks are bypassed. */
export async function markNotificationReadAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("user");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { error } = await auth.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("customer_id", auth.ctx.user.id)
    .is("read_at", null);

  if (error) {
    console.error("[notifications] Mark read failed:", error.message);
    return { ok: false, message: "We couldn’t update that notification." };
  }

  revalidatePath("/account/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<SimpleActionResult> {
  const auth = await authorize("user");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { error } = await auth.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("customer_id", auth.ctx.user.id)
    .is("read_at", null);

  if (error) {
    console.error("[notifications] Mark all read failed:", error.message);
    return { ok: false, message: "We couldn’t update your notifications." };
  }

  revalidatePath("/account/notifications");
  return { ok: true };
}

export async function deleteNotificationAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("user");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { error } = await auth.supabase.from("notifications").delete().eq("id", id).eq("customer_id", auth.ctx.user.id);

  if (error) {
    console.error("[notifications] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that notification." };
  }

  revalidatePath("/account/notifications");
  return { ok: true };
}
