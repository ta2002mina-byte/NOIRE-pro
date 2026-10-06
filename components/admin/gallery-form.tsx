"use client";

import { useActionState } from "react";
import Link from "next/link";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { buttonStyles } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { TABLE_AREAS } from "@/lib/constants/reservation";
import type { GalleryImage } from "@/lib/data/gallery";

interface GalleryFormProps {
  image?: GalleryImage;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

/** Create and edit share one form. `space` is free text (not the reservation
 * area enum) — the datalist below just offers the existing area names as
 * suggestions so labels stay consistent without forcing a fixed set. */
export function GalleryForm({ image, action }: GalleryFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;
  const err = state.fieldErrors;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <ImageUploadField
        name="imageUrl"
        label="Photo"
        folder="gallery"
        defaultValue={v?.imageUrl ?? image?.image_url ?? ""}
        error={err?.imageUrl}
      />

      <div>
        <TextField
          name="space"
          label="Space (optional)"
          placeholder="Main Hall"
          list="gallery-space-options"
          maxLength={80}
          defaultValue={v?.space ?? image?.space ?? ""}
          hint="Groups photos on /space, e.g. Main Hall, Rooftop, Garden. Leave blank for a general Gallery group."
          error={err?.space}
        />
        <datalist id="gallery-space-options">
          {TABLE_AREAS.map((area) => (
            <option key={area.value} value={area.label} />
          ))}
        </datalist>
      </div>

      <TextField
        name="caption"
        label="Caption (optional)"
        placeholder="Shown under the photo on /space."
        maxLength={200}
        defaultValue={v?.caption ?? image?.caption ?? ""}
        error={err?.caption}
      />

      <TextField
        name="altText"
        label="Alt text (optional)"
        placeholder="Describes the photo for screen readers."
        maxLength={200}
        defaultValue={v?.altText ?? image?.alt_text ?? ""}
        hint="Leave blank to fall back to the space name."
        error={err?.altText}
      />

      <TextField
        name="sortOrder"
        label="Sort order"
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        defaultValue={v?.sortOrder ?? String(image?.sort_order ?? 0)}
        hint="Lower numbers show first."
        error={err?.sortOrder}
      />

      <CheckboxField
        name="isActive"
        label="Active — shown on the homepage and /space"
        defaultChecked={image?.is_active ?? true}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{image ? "Save changes" : "Add photo"}</SubmitButton>
        <Link href="/admin/gallery" className={buttonStyles({ variant: "outline" })}>
          Back to gallery
        </Link>
      </div>
    </form>
  );
}
