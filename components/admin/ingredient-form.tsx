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
import { initialFormState, type FormState } from "@/lib/actions/state";
import type { Ingredient } from "@/lib/data/ingredients";

interface IngredientFormProps {
  ingredient?: Ingredient;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

/** Create and edit share one form; only the bound server action and defaults differ.
 * Sourcing and dish links are managed separately, below this form, once the
 * ingredient exists — see the edit page. */
export function IngredientForm({ ingredient, action }: IngredientFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <TextField
        name="name"
        label="Name"
        placeholder="Heirloom tomato"
        required
        maxLength={120}
        defaultValue={v?.name ?? ingredient?.name ?? ""}
        error={state.fieldErrors?.name}
      />

      <TextField
        name="slug"
        label="Slug"
        placeholder="heirloom-tomato"
        maxLength={80}
        defaultValue={v?.slug ?? ingredient?.slug ?? ""}
        hint="Leave blank to generate one from the name."
        error={state.fieldErrors?.slug}
      />

      <TextareaField
        name="description"
        label="Description"
        placeholder="What it is, how it's used — shown on /our-ingredients."
        maxLength={600}
        defaultValue={v?.description ?? ingredient?.description ?? ""}
        error={state.fieldErrors?.description}
      />

      <ImageUploadField
        name="imageUrl"
        label="Image"
        folder="ingredients"
        defaultValue={v?.imageUrl ?? ingredient?.image_url ?? ""}
        hint="Leave blank to show no image."
        error={state.fieldErrors?.imageUrl}
      />

      <TextField
        name="season"
        label="Season (optional)"
        placeholder="Late summer"
        maxLength={120}
        defaultValue={v?.season ?? ingredient?.season ?? ""}
        hint="A general season, separate from any one source's specific harvest window below."
        error={state.fieldErrors?.season}
      />

      <CheckboxField
        name="isActive"
        label="Active — shown on /our-ingredients and selectable for chef notes and dishes"
        defaultChecked={ingredient?.is_active ?? true}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{ingredient ? "Save changes" : "Create ingredient"}</SubmitButton>
        <Link href="/admin/ingredients" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
