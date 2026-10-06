"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { journalEntrySchema } from "@/lib/validations/journal";

function readJournalForm(formData: FormData) {
  return {
    menuItemId: readString(formData, "menuItemId"),
    visitedAt: readString(formData, "visitedAt"),
    rating: readString(formData, "rating"),
    personalNote: readString(formData, "personalNote"),
  };
}

function toEchoValues(raw: ReturnType<typeof readJournalForm>): Record<string, string> {
  return raw;
}

/** Customers add entries about their own dining only; identity comes from the
 * validated session, never from the form. */
export async function createJournalEntryAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("user");
  if (!auth.ok) return { status: "error", message: auth.message };

  const raw = readJournalForm(formData);
  const parsed = journalEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  // RLS also enforces customer_id = auth.uid() and that any linked dining_history_id
  // belongs to this customer; we never write a menu_item_id or dining_history_id the
  // client didn't have visibility into a moment ago.
  const { error } = await auth.supabase.from("dining_journal").insert({
    customer_id: auth.ctx.user.id,
    menu_item_id: data.menuItemId,
    visited_at: data.visitedAt,
    rating: data.rating,
    personal_note: data.personalNote,
  });

  if (error) {
    console.error("[journal] create failed:", error.message);
    return { status: "error", message: "We couldn’t save that entry. Please try again.", values: toEchoValues(raw) };
  }

  revalidatePath("/account/journal");
  return { status: "success", message: "Entry added to your journal." };
}

/** Bind the entry id with `.bind(null, entryId)` before passing to useActionState. */
export async function updateJournalEntryAction(
  entryId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await authorize("user");
  if (!auth.ok) return { status: "error", message: auth.message };

  const raw = readJournalForm(formData);
  const parsed = journalEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const { data: updated, error } = await auth.supabase
    .from("dining_journal")
    .update({
      menu_item_id: data.menuItemId,
      visited_at: data.visitedAt,
      rating: data.rating,
      personal_note: data.personalNote,
    })
    .eq("id", entryId)
    .eq("customer_id", auth.ctx.user.id)
    .select("id");

  if (error) {
    console.error("[journal] update failed:", error.message);
    return { status: "error", message: "We couldn’t save your changes. Please try again.", values: toEchoValues(raw) };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "That entry couldn’t be found." };
  }

  revalidatePath("/account/journal");
  return { status: "success", message: "Entry updated." };
}

export interface DeleteJournalEntryResult {
  ok: boolean;
  message?: string;
}

/** Customers may only delete their own entries — RLS enforces this even if this check is bypassed. */
export async function deleteJournalEntryAction(entryId: string): Promise<DeleteJournalEntryResult> {
  const auth = await authorize("user");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { data, error } = await auth.supabase
    .from("dining_journal")
    .delete()
    .eq("id", entryId)
    .eq("customer_id", auth.ctx.user.id)
    .select("id");

  if (error) {
    console.error("[journal] delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that entry. Please try again." };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "That entry couldn’t be found." };
  }

  revalidatePath("/account/journal");
  return { ok: true };
}
