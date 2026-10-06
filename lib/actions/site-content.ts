"use server";

import { revalidatePath } from "next/cache";

import type { Json } from "@/types/database";
import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { zonedLocalToUtc } from "@/lib/utils/timezone";
import { siteContentSchema } from "@/lib/validations/site-content";

const TEXT_FIELDS = [
  "heroImageUrl",
  "heroEyebrow",
  "heroHeading",
  "heroSubtext",
  "heroPrimaryLabel",
  "heroPrimaryHref",
  "heroSecondaryLabel",
  "heroSecondaryHref",
  "bannerMessage",
  "bannerLinkLabel",
  "bannerLinkHref",
  "bannerStartsAt",
  "bannerEndsAt",
  "footerLogoUrl",
  "footerImageUrl",
  "footerTagline",
  "footerCopyright",
  "footerInstagramUrl",
  "footerFacebookUrl",
  "footerTiktokUrl",
  "footerYoutubeUrl",
  "footerXUrl",
  "footerLinks",
] as const;

function readSiteContentForm(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const field of TEXT_FIELDS) raw[field] = readString(formData, field);
  raw.bannerEnabled = formData.get("bannerEnabled") === "on" ? "on" : "";
  return raw;
}

/** The banner shows on every public page, the hero on the homepage and the footer everywhere. */
function revalidateSiteContentPaths() {
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

export async function updateSiteContentAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("staff");
  if (!auth.ok) return { status: "error", message: auth.message };

  const restaurant = await getRestaurant();
  if (!restaurant) return { status: "error", message: "We can’t find the restaurant record right now." };

  const raw = readSiteContentForm(formData);
  const parsed = siteContentSchema.safeParse({ ...raw, bannerEnabled: raw.bannerEnabled === "on" });
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: raw };
  }

  const { data } = parsed;
  // Banner dates are typed in the restaurant's own time zone and stored as UTC.
  const startsAt = data.bannerStartsAt ? zonedLocalToUtc(data.bannerStartsAt, restaurant.timezone) : null;
  const endsAt = data.bannerEndsAt ? zonedLocalToUtc(data.bannerEndsAt, restaurant.timezone) : null;
  if ((data.bannerStartsAt && !startsAt) || (data.bannerEndsAt && !endsAt)) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: { bannerStartsAt: ["Enter a valid date and time."] }, values: raw };
  }

  const payload = {
    restaurant_id: restaurant.id,
    hero_image_url: data.heroImageUrl,
    hero_eyebrow: data.heroEyebrow,
    hero_heading: data.heroHeading,
    hero_subtext: data.heroSubtext,
    hero_primary_label: data.heroPrimaryLabel,
    hero_primary_href: data.heroPrimaryHref,
    hero_secondary_label: data.heroSecondaryLabel,
    hero_secondary_href: data.heroSecondaryHref,
    banner_enabled: data.bannerEnabled,
    banner_message: data.bannerMessage,
    banner_link_label: data.bannerLinkLabel,
    banner_link_href: data.bannerLinkHref,
    banner_starts_at: startsAt ? startsAt.toISOString() : null,
    banner_ends_at: endsAt ? endsAt.toISOString() : null,
    footer_logo_url: data.footerLogoUrl,
    footer_image_url: data.footerImageUrl,
    footer_tagline: data.footerTagline,
    footer_copyright: data.footerCopyright,
    footer_instagram_url: data.footerInstagramUrl,
    footer_facebook_url: data.footerFacebookUrl,
    footer_tiktok_url: data.footerTiktokUrl,
    footer_youtube_url: data.footerYoutubeUrl,
    footer_x_url: data.footerXUrl,
    footer_links: data.footerLinks as unknown as Json,
  };

  const { error } = await auth.supabase.from("site_content").upsert(payload, { onConflict: "restaurant_id" });

  if (error) {
    console.error("[site-content] Save failed:", error.message);
    return { status: "error", message: "We couldn’t save the site content. Please try again.", values: raw };
  }

  revalidateSiteContentPaths();
  return { status: "success", message: "Site content saved." };
}
