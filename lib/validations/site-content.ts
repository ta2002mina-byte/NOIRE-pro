import { z } from "zod";

import { isHttpsUrl, isSafeHref, parseFooterLinks } from "@/lib/utils/site-links";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

const optionalHref = z
  .string()
  .trim()
  .max(300, "Keep the link under 300 characters.")
  .refine((value) => value === "" || isSafeHref(value), "Use /page, #section, https://…, mailto: or tel:.")
  .transform((value) => (value === "" ? null : value));

const optionalSocialUrl = z
  .string()
  .trim()
  .max(300, "Keep the link under 300 characters.")
  .refine((value) => value === "" || isHttpsUrl(value), "Enter a full https:// link.")
  .transform((value) => (value === "" ? null : value));

const footerLinksField = z.string().transform((value, ctx) => {
  const { links, error } = parseFooterLinks(value);
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    return z.NEVER;
  }
  return links;
});

/** Date fields arrive as "YYYY-MM-DDTHH:mm" (or ""). The action converts them to UTC. */
const optionalLocalDateTime = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value), "Enter a valid date and time.");

export const siteContentSchema = z
  .object({
    heroImageUrl: z
      .string()
      .trim()
      .refine((value) => value === "" || isHttpsUrl(value), "Upload an image or paste a full https:// URL.")
      .transform((value) => (value === "" ? null : value)),
    heroEyebrow: optionalText(60, "Keep this under 60 characters."),
    heroHeading: optionalText(120, "Keep the heading under 120 characters."),
    heroSubtext: optionalText(200, "Keep the subtext under 200 characters."),
    heroPrimaryLabel: optionalText(40, "Keep the button text under 40 characters."),
    heroPrimaryHref: optionalHref,
    heroSecondaryLabel: optionalText(40, "Keep the button text under 40 characters."),
    heroSecondaryHref: optionalHref,

    bannerEnabled: z.boolean(),
    bannerMessage: optionalText(200, "Keep the message under 200 characters."),
    bannerLinkLabel: optionalText(40, "Keep the link text under 40 characters."),
    bannerLinkHref: optionalHref,
    bannerStartsAt: optionalLocalDateTime,
    bannerEndsAt: optionalLocalDateTime,

    footerLogoUrl: z
      .string()
      .trim()
      .refine((value) => value === "" || isHttpsUrl(value), "Upload an image or paste a full https:// URL.")
      .transform((value) => (value === "" ? null : value)),
    footerImageUrl: z
      .string()
      .trim()
      .refine((value) => value === "" || isHttpsUrl(value), "Upload an image or paste a full https:// URL.")
      .transform((value) => (value === "" ? null : value)),
    footerTagline: optionalText(200, "Keep the tagline under 200 characters."),
    footerCopyright: optionalText(200, "Keep this under 200 characters."),
    footerInstagramUrl: optionalSocialUrl,
    footerFacebookUrl: optionalSocialUrl,
    footerTiktokUrl: optionalSocialUrl,
    footerYoutubeUrl: optionalSocialUrl,
    footerXUrl: optionalSocialUrl,
    footerLinks: footerLinksField,
  })
  .superRefine((data, ctx) => {
    if (data.bannerEnabled && !data.bannerMessage) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerMessage"], message: "Write the banner message, or switch the banner off." });
    }
    if (data.bannerLinkHref && !data.bannerLinkLabel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerLinkLabel"], message: "Add the link text, or clear the link." });
    }
    if (data.bannerLinkLabel && !data.bannerLinkHref) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerLinkHref"], message: "Add the link address, or clear the link text." });
    }
    if (data.heroPrimaryLabel && !data.heroPrimaryHref) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heroPrimaryHref"], message: "Add a link for this button, or clear its text." });
    }
    if (data.heroSecondaryLabel && !data.heroSecondaryHref) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["heroSecondaryHref"], message: "Add a link for this button, or clear its text." });
    }
    // Same fixed-width format on both sides, so string comparison is chronological.
    if (data.bannerStartsAt && data.bannerEndsAt && data.bannerEndsAt <= data.bannerStartsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerEndsAt"], message: "The end must be after the start." });
    }
  });

export type SiteContentInput = z.infer<typeof siteContentSchema>;
