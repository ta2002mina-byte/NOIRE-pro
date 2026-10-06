/**
 * Turns free text into a URL-friendly slug that matches the
 * `^[a-z0-9]+(-[a-z0-9]+)*$` check constraint used across the schema
 * (dining_experiences.slug, menu_items.slug, ...).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
