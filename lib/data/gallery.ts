import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type GalleryImage = Tables<"gallery">;

export async function getGalleryImages(restaurantId: string): Promise<GalleryImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[data/gallery] getGalleryImages:", error.message);
    return [];
  }
  return data ?? [];
}

/** Groups active gallery images by their `space` label (e.g. "Main Hall",
 * "Rooftop"). Images with no space set are grouped under "Gallery". */
export function groupGalleryBySpace(images: GalleryImage[]): { space: string; images: GalleryImage[] }[] {
  const groups = new Map<string, GalleryImage[]>();
  for (const image of images) {
    const key = image.space?.trim() || "Gallery";
    const list = groups.get(key) ?? [];
    list.push(image);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([space, imgs]) => ({ space, images: imgs }));
}

/** Every gallery image (active and inactive) for the admin list, in display order. */
export async function getGalleryForAdmin(restaurantId: string): Promise<GalleryImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/gallery] getGalleryForAdmin:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getGalleryImageByIdForAdmin(restaurantId: string, id: string): Promise<GalleryImage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) {
    console.error("[data/gallery] getGalleryImageByIdForAdmin:", error.message);
    return null;
  }
  return data;
}
