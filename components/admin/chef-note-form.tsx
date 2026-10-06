"use client";

import { useActionState } from "react";
import Link from "next/link";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { buttonStyles } from "@/components/ui/button";
import { toDatetimeLocalValue } from "@/lib/actions/chef";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { CHEF_NOTE_STATUS_LABELS } from "@/lib/constants/labels";
import { CHEF_NOTE_STATUSES } from "@/lib/validations/chef-note";
import type { ChefNote } from "@/lib/data/chef";
import type { IngredientOption } from "@/lib/data/ingredients";

interface ChefNoteFormProps {
  note?: ChefNote;
  ingredientOptions: IngredientOption[];
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

/** Create and edit share one form; only the bound server action and defaults differ. */
export function ChefNoteForm({ note, ingredientOptions, action }: ChefNoteFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;
  const status = v?.status ?? note?.status ?? "draft";

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <TextField
        name="title"
        label="Title"
        placeholder="This week, from the walled garden"
        required
        maxLength={160}
        defaultValue={v?.title ?? note?.title ?? ""}
        error={state.fieldErrors?.title}
      />

      <TextareaField
        name="body"
        label="Note"
        placeholder="The chef's note, in full — this is what guests read on /chef."
        rows={8}
        maxLength={4000}
        defaultValue={v?.body ?? note?.body ?? ""}
        error={state.fieldErrors?.body}
      />

      <ImageUploadField
        name="imageUrl"
        label="Image"
        folder="chef"
        defaultValue={v?.imageUrl ?? note?.image_url ?? ""}
        hint="Leave blank to show none."
        error={state.fieldErrors?.imageUrl}
      />

      <SelectField
        name="ingredientId"
        label="Related ingredient (optional)"
        defaultValue={v?.ingredientId ?? note?.ingredient_id ?? ""}
        hint="Shown as a badge on the note and links the two stories together."
        error={state.fieldErrors?.ingredientId}
      >
        <option value="">None</option>
        {ingredientOptions.map((ingredient) => (
          <option key={ingredient.id} value={ingredient.id}>
            {ingredient.name}
            {!ingredient.is_active ? " (inactive)" : ""}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          name="status"
          label="Status"
          defaultValue={status}
          error={state.fieldErrors?.status}
        >
          {CHEF_NOTE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CHEF_NOTE_STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>

        <TextField
          name="publishAt"
          label="Publish at"
          type="datetime-local"
          defaultValue={v?.publishAt ?? toDatetimeLocalValue(note?.publish_at ?? null)}
          hint="Required when status is Scheduled. Ignored otherwise."
          error={state.fieldErrors?.publishAt}
        />
      </div>

      <CheckboxField
        name="isFeatured"
        label="Featured — shown first on /chef and the homepage"
        defaultChecked={note?.is_featured ?? false}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{note ? "Save changes" : "Create note"}</SubmitButton>
        <Link href="/admin/chef" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
