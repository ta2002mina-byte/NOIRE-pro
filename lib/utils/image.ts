/** Hosts covered by `next.config.mjs`'s `images.remotePatterns` — safe to run
 * through Next's image optimizer. Admin-entered image URLs can point at any
 * host, so callers should fall back to `unoptimized` for anything else. */
export function isOptimizableImageHost(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}


// ---------------------------------------------------------------------
// Admin image uploads (Supabase Storage, bucket "media" — see
// supabase/migrations/20260929000100_noire_05_storage.sql)
// ---------------------------------------------------------------------

export const MEDIA_BUCKET = "media";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Choose a JPEG, PNG, WebP or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "That image is over 5MB — choose a smaller file.";
  }
  return null;
}

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** A storage path under the given folder (e.g. "menu", "chef") that keeps the
 * original extension but never trusts the original filename otherwise. */
export function buildMediaPath(folder: string, file: File): string {
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
  return `${folder}/${randomId()}.${ext}`;
}
