import "server-only";

import { isChefNoteLive } from "@/lib/data/visibility";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ChefNote = Tables<"chef_notes"> & {
  ingredient: Pick<Tables<"ingredients">, "id" | "name" | "slug" | "is_active"> | null;
};

/**
 * Published, or scheduled-and-due, chef notes, newest first. Drafts and archived
 * notes are excluded here as well as by RLS, so staff sessions see the public site too.
 */
export async function getPublishedChefNotes(restaurantId: string): Promise<ChefNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chef_notes")
    .select("*, ingredient:ingredients(id, name, slug, is_active)")
    .eq("restaurant_id", restaurantId)
    .in("status", ["published", "scheduled"])
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/chef] getPublishedChefNotes:", error.message);
    return [];
  }
  const now = new Date();
  return ((data as ChefNote[]) ?? [])
    .filter((note) => isChefNoteLive(note, now))
    // An ingredient that is switched off is not shown on a public note either.
    .map((note) => (note.ingredient && !note.ingredient.is_active ? { ...note, ingredient: null } : note));
}

export async function getFeaturedChefNote(restaurantId: string): Promise<ChefNote | null> {
  const notes = await getPublishedChefNotes(restaurantId);
  return notes.find((n) => n.is_featured) ?? notes[0] ?? null;
}

/** Admin listing: every note regardless of status, newest edited first. */
export async function getAllChefNotes(restaurantId: string): Promise<ChefNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chef_notes")
    .select("*, ingredient:ingredients(id, name, slug, is_active)")
    .eq("restaurant_id", restaurantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[data/chef] getAllChefNotes:", error.message);
    return [];
  }
  return (data as ChefNote[]) ?? [];
}

/** A single note for the admin edit form. Null if it doesn't exist or belongs to another restaurant. */
export async function getChefNoteById(restaurantId: string, id: string): Promise<ChefNote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chef_notes")
    .select("*, ingredient:ingredients(id, name, slug, is_active)")
    .eq("restaurant_id", restaurantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[data/chef] getChefNoteById:", error.message);
    return null;
  }
  return data as ChefNote | null;
}
