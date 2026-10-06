"use client";

import { useActionState } from "react";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { SITE_CONTENT_DEFAULTS as D } from "@/lib/constants/site-content";
import type { SiteContent } from "@/lib/data/site-content";
import { footerLinksToText, normalizeFooterLinks } from "@/lib/utils/site-links";
import { utcToZonedLocal } from "@/lib/utils/timezone";

interface SiteContentFormProps {
  content: SiteContent | null;
  /** IANA time zone of the restaurant — banner dates are entered in this zone. */
  timezone: string;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

export function SiteContentForm({ content, timezone, action }: SiteContentFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;
  const err = state.fieldErrors;

  const bannerEnabled = v ? v.bannerEnabled === "on" : (content?.banner_enabled ?? false);

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-12">
      <FormMessage state={state} />

      {/* ------------------------------ Hero ------------------------------ */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-lg text-ivory">Homepage hero</h2>
          <p className="mt-1 text-sm text-mute">The big opening section. Leave a field blank to use the default text.</p>
        </div>

        <ImageUploadField
          name="heroImageUrl"
          label="Background image"
          folder="site"
          defaultValue={v?.heroImageUrl ?? content?.hero_image_url ?? ""}
          hint="Leave empty to use your first active gallery photo. Wide, dark photos work best."
          error={err?.heroImageUrl}
        />

        <TextField
          name="heroEyebrow"
          label="Small line above the heading"
          placeholder={D.heroEyebrow}
          maxLength={60}
          defaultValue={v?.heroEyebrow ?? content?.hero_eyebrow ?? ""}
          error={err?.heroEyebrow}
        />
        <TextField
          name="heroHeading"
          label="Heading"
          placeholder={D.heroHeading}
          maxLength={120}
          defaultValue={v?.heroHeading ?? content?.hero_heading ?? ""}
          error={err?.heroHeading}
        />
        <TextField
          name="heroSubtext"
          label="Subtext"
          placeholder={D.heroSubtext}
          maxLength={200}
          defaultValue={v?.heroSubtext ?? content?.hero_subtext ?? ""}
          error={err?.heroSubtext}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="heroPrimaryLabel"
            label="Main button text"
            placeholder={D.heroPrimaryLabel}
            maxLength={40}
            defaultValue={v?.heroPrimaryLabel ?? content?.hero_primary_label ?? ""}
            error={err?.heroPrimaryLabel}
          />
          <TextField
            name="heroPrimaryHref"
            label="Main button link"
            placeholder={D.heroPrimaryHref}
            maxLength={300}
            defaultValue={v?.heroPrimaryHref ?? content?.hero_primary_href ?? ""}
            error={err?.heroPrimaryHref}
          />
          <TextField
            name="heroSecondaryLabel"
            label="Second button text"
            placeholder={D.heroSecondaryLabel}
            maxLength={40}
            defaultValue={v?.heroSecondaryLabel ?? content?.hero_secondary_label ?? ""}
            error={err?.heroSecondaryLabel}
          />
          <TextField
            name="heroSecondaryHref"
            label="Second button link"
            placeholder={D.heroSecondaryHref}
            maxLength={300}
            defaultValue={v?.heroSecondaryHref ?? content?.hero_secondary_href ?? ""}
            error={err?.heroSecondaryHref}
            hint="A page like /menu, a section like #tonight, or a full https:// link."
          />
        </div>
      </section>

      {/* ----------------------------- Banner ----------------------------- */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-lg text-ivory">Announcement banner</h2>
          <p className="mt-1 text-sm text-mute">A slim message bar at the top of every public page.</p>
        </div>

        <CheckboxField name="bannerEnabled" label="Show the banner" defaultChecked={bannerEnabled} />

        <TextField
          name="bannerMessage"
          label="Message"
          placeholder="Now taking bookings for New Year’s Eve."
          maxLength={200}
          defaultValue={v?.bannerMessage ?? content?.banner_message ?? ""}
          error={err?.bannerMessage}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="bannerLinkLabel"
            label="Link text (optional)"
            placeholder="Reserve now"
            maxLength={40}
            defaultValue={v?.bannerLinkLabel ?? content?.banner_link_label ?? ""}
            error={err?.bannerLinkLabel}
          />
          <TextField
            name="bannerLinkHref"
            label="Link address (optional)"
            placeholder="/reserve"
            maxLength={300}
            defaultValue={v?.bannerLinkHref ?? content?.banner_link_href ?? ""}
            error={err?.bannerLinkHref}
          />
          <TextField
            name="bannerStartsAt"
            label="Show from (optional)"
            type="datetime-local"
            defaultValue={v?.bannerStartsAt ?? utcToZonedLocal(content?.banner_starts_at, timezone)}
            error={err?.bannerStartsAt}
          />
          <TextField
            name="bannerEndsAt"
            label="Hide after (optional)"
            type="datetime-local"
            defaultValue={v?.bannerEndsAt ?? utcToZonedLocal(content?.banner_ends_at, timezone)}
            error={err?.bannerEndsAt}
            hint={`Times are in the restaurant’s time zone (${timezone}).`}
          />
        </div>
      </section>

      {/* ----------------------------- Footer ----------------------------- */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-lg text-ivory">Footer</h2>
          <p className="mt-1 text-sm text-mute">
            Address, phone and email come from Settings. Blank fields use the default text.
          </p>
        </div>

        <ImageUploadField
          name="footerLogoUrl"
          label="Footer logo (optional)"
          folder="site"
          defaultValue={v?.footerLogoUrl ?? content?.footer_logo_url ?? ""}
          hint="Replaces the NOIRÉ text mark in the footer. A transparent PNG or WebP works best."
          error={err?.footerLogoUrl}
        />

        <ImageUploadField
          name="footerImageUrl"
          label="Footer background image (optional)"
          folder="site"
          defaultValue={v?.footerImageUrl ?? content?.footer_image_url ?? ""}
          hint="Shown faintly behind the footer. Use one, both, or neither."
          error={err?.footerImageUrl}
        />

        <TextField
          name="footerTagline"
          label="Tagline"
          placeholder={D.footerTagline}
          maxLength={200}
          defaultValue={v?.footerTagline ?? content?.footer_tagline ?? ""}
          error={err?.footerTagline}
        />
        <TextField
          name="footerCopyright"
          label="Copyright line"
          placeholder={D.footerCopyright}
          maxLength={200}
          defaultValue={v?.footerCopyright ?? content?.footer_copyright ?? ""}
          hint="{year} becomes the current year and {name} the restaurant name."
          error={err?.footerCopyright}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="footerInstagramUrl"
            label="Instagram"
            placeholder="https://instagram.com/…"
            maxLength={300}
            defaultValue={v?.footerInstagramUrl ?? content?.footer_instagram_url ?? ""}
            error={err?.footerInstagramUrl}
          />
          <TextField
            name="footerFacebookUrl"
            label="Facebook"
            placeholder="https://facebook.com/…"
            maxLength={300}
            defaultValue={v?.footerFacebookUrl ?? content?.footer_facebook_url ?? ""}
            error={err?.footerFacebookUrl}
          />
          <TextField
            name="footerTiktokUrl"
            label="TikTok"
            placeholder="https://tiktok.com/@…"
            maxLength={300}
            defaultValue={v?.footerTiktokUrl ?? content?.footer_tiktok_url ?? ""}
            error={err?.footerTiktokUrl}
          />
          <TextField
            name="footerYoutubeUrl"
            label="YouTube"
            placeholder="https://youtube.com/@…"
            maxLength={300}
            defaultValue={v?.footerYoutubeUrl ?? content?.footer_youtube_url ?? ""}
            error={err?.footerYoutubeUrl}
          />
          <TextField
            name="footerXUrl"
            label="X (Twitter)"
            placeholder="https://x.com/…"
            maxLength={300}
            defaultValue={v?.footerXUrl ?? content?.footer_x_url ?? ""}
            error={err?.footerXUrl}
          />
        </div>

        <TextareaField
          name="footerLinks"
          label="Extra footer links (optional)"
          placeholder={"Careers | /contact\nPrivacy | /privacy"}
          rows={4}
          defaultValue={v?.footerLinks ?? footerLinksToText(normalizeFooterLinks(content?.footer_links))}
          hint="One per line as “Label | link”. Up to 6. They appear under Explore."
          error={err?.footerLinks}
        />
      </section>

      <div className="pt-2">
        <SubmitButton pendingLabel="Saving…">Save site content</SubmitButton>
      </div>
    </form>
  );
}
