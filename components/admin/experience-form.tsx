"use client";

import { useActionState } from "react";
import Link from "next/link";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { buttonStyles } from "@/components/ui/button";
import { TABLE_AREAS } from "@/lib/constants/reservation";
import { initialFormState, type FormState } from "@/lib/actions/state";
import type { DiningExperience } from "@/lib/data/experiences";

interface ExperienceFormProps {
  experience?: DiningExperience;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

/** Create and edit share one form; only the bound server action and defaults differ. */
export function ExperienceForm({ experience, action }: ExperienceFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <TextField
        name="title"
        label="Title"
        placeholder="Romantic Dinner"
        required
        maxLength={120}
        defaultValue={v?.title ?? experience?.title ?? ""}
        error={state.fieldErrors?.title}
      />

      <TextField
        name="slug"
        label="Slug"
        placeholder="romantic-dinner"
        maxLength={80}
        defaultValue={v?.slug ?? experience?.slug ?? ""}
        hint="Used in the reservation link. Leave blank to generate one from the title."
        error={state.fieldErrors?.slug}
      />

      <TextareaField
        name="description"
        label="Description"
        placeholder="What makes this experience distinct — shown to guests choosing it."
        maxLength={600}
        defaultValue={v?.description ?? experience?.description ?? ""}
        error={state.fieldErrors?.description}
      />

      <ImageUploadField
        name="imageUrl"
        label="Image"
        folder="experiences"
        defaultValue={v?.imageUrl ?? experience?.image_url ?? ""}
        hint="Leave blank to show a placeholder."
        error={state.fieldErrors?.imageUrl}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          name="minGuests"
          label="Minimum guests (optional)"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          defaultValue={v?.minGuests ?? experience?.min_guests?.toString() ?? ""}
          error={state.fieldErrors?.minGuests}
        />
        <TextField
          name="maxGuests"
          label="Maximum guests (optional)"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          defaultValue={v?.maxGuests ?? experience?.max_guests?.toString() ?? ""}
          error={state.fieldErrors?.maxGuests}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ivory">Available areas</legend>
        <p className="text-sm text-mute">Leave all unchecked to allow any area.</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {TABLE_AREAS.map((area) => (
            <CheckboxField
              key={area.value}
              name="availableAreas"
              value={area.value}
              label={area.label}
              defaultChecked={experience?.available_areas?.includes(area.value) ?? false}
            />
          ))}
        </div>
        {state.fieldErrors?.availableAreas ? (
          <p role="alert" className="text-sm text-danger">
            {state.fieldErrors.availableAreas[0]}
          </p>
        ) : null}
      </fieldset>

      <TextareaField
        name="preparationNotes"
        label="Preparation notes (internal)"
        placeholder="Notes for staff preparing this experience — not shown to guests."
        maxLength={600}
        defaultValue={v?.preparationNotes ?? experience?.preparation_notes ?? ""}
        error={state.fieldErrors?.preparationNotes}
      />

      <TextField
        name="sortOrder"
        label="Display order"
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        defaultValue={v?.sortOrder ?? experience?.sort_order?.toString() ?? "0"}
        hint="Lower numbers appear first."
        error={state.fieldErrors?.sortOrder}
      />

      <CheckboxField
        name="isActive"
        label="Active — visible to guests and selectable for reservations"
        defaultChecked={experience?.is_active ?? true}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{experience ? "Save changes" : "Create experience"}</SubmitButton>
        <Link href="/admin/experiences" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
