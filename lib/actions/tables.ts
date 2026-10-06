"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { tableSchema, type TableInput } from "@/lib/validations/table";

export type SimpleActionResult = { ok: true } | { ok: false; message: string };

/** Every route that shows the floor plan or offers tables to guests. */
function revalidateTablePaths() {
  revalidatePath("/admin/tables");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/tonight");
  revalidatePath("/reserve");
}

function readTableForm(formData: FormData) {
  return {
    label: readString(formData, "label"),
    area: readString(formData, "area"),
    shape: readString(formData, "shape"),
    minCapacity: readString(formData, "minCapacity"),
    capacity: readString(formData, "capacity"),
    posX: readString(formData, "posX"),
    posY: readString(formData, "posY"),
    width: readString(formData, "width"),
    height: readString(formData, "height"),
    notes: readString(formData, "notes"),
    isActive: formData.get("isActive") === "on",
  };
}

function toEchoValues(raw: ReturnType<typeof readTableForm>): Record<string, string> {
  return {
    label: raw.label,
    area: raw.area,
    shape: raw.shape,
    minCapacity: raw.minCapacity,
    capacity: raw.capacity,
    posX: raw.posX,
    posY: raw.posY,
    width: raw.width,
    height: raw.height,
    notes: raw.notes,
  };
}

function toRow(data: TableInput) {
  return {
    label: data.label,
    area: data.area,
    shape: data.shape,
    min_capacity: data.minCapacity,
    capacity: data.capacity,
    pos_x: data.posX,
    pos_y: data.posY,
    width: data.width,
    height: data.height,
    notes: data.notes,
    is_active: data.isActive,
  };
}

export async function createTableAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readTableForm(formData);
  const parsed = tableSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { error } = await auth.supabase.from("tables").insert({ restaurant_id: restaurant.id, ...toRow(parsed.data) });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { label: ["A table with this label already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[tables] Create failed:", error.message);
    return { status: "error", message: "We couldn’t save that table. Please try again.", values: toEchoValues(raw) };
  }

  revalidateTablePaths();
  return { status: "success", message: `Table “${parsed.data.label}” was created.` };
}

export async function updateTableAction(id: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readTableForm(formData);
  const parsed = tableSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data, error } = await auth.supabase
    .from("tables")
    .update(toRow(parsed.data))
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { label: ["A table with this label already exists."] },
        values: toEchoValues(raw),
      };
    }
    console.error("[tables] Update failed:", error.message);
    return { status: "error", message: "We couldn’t save your changes. Please try again.", values: toEchoValues(raw) };
  }
  if (!data || data.length === 0) return { status: "error", message: "That table no longer exists.", values: toEchoValues(raw) };

  revalidateTablePaths();
  return { status: "success", message: "Table updated." };
}

/**
 * Deleting a table would silently un-assign any reservation that still points at it
 * (the foreign key is ON DELETE SET NULL), so a table with pending or confirmed
 * reservations must be deactivated instead.
 */
export async function deleteTableAction(id: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { ok: false, message: "We can’t find the restaurant record right now." };

  const { count, error: countError } = await auth.supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("table_id", id)
    .in("status", ["pending", "confirmed"]);

  if (countError) {
    console.error("[tables] Reservation check failed:", countError.message);
    return { ok: false, message: "We couldn’t check this table’s reservations. Please try again." };
  }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: `This table has ${count} pending or confirmed ${count === 1 ? "reservation" : "reservations"}. Move them first, or deactivate the table instead.`,
    };
  }

  const { data, error } = await auth.supabase.from("tables").delete().eq("id", id).eq("restaurant_id", restaurant.id).select("id");

  if (error) {
    console.error("[tables] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that table." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That table no longer exists." };

  revalidateTablePaths();
  return { ok: true };
}
