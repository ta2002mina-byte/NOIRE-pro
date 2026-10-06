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
import { initialFormState, type FormState } from "@/lib/actions/state";
import { STORY_TYPE_LABELS } from "@/lib/constants/labels";
import { STORY_TYPES } from "@/lib/validations/story";
import { toDatetimeLocalValue } from "@/lib/validations/shared";
import type { RestaurantStory } from "@/lib/data/stories";

interface StoryFormProps {
  story?: RestaurantStory;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

/** Create and edit share one form; only the bound server action and defaults differ. */
export function StoryForm({ story, action }: StoryFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <TextField
        name="title"
        label="Title"
        placeholder="Tonight, from the wood-fired oven"
        required
        maxLength={160}
        defaultValue={v?.title ?? story?.title ?? ""}
        error={state.fieldErrors?.title}
      />

      <TextareaField
        name="description"
        label="Description"
        placeholder="What's happening — shown on /stories."
        maxLength={2000}
        defaultValue={v?.description ?? story?.description ?? ""}
        error={state.fieldErrors?.description}
      />

      <ImageUploadField
        name="mediaUrl"
        label="Image"
        folder="stories"
        defaultValue={v?.mediaUrl ?? story?.media_url ?? ""}
        hint="Leave blank to show none."
        error={state.fieldErrors?.mediaUrl}
      />

      <SelectField
        name="storyType"
        label="Story type"
        defaultValue={v?.storyType ?? story?.story_type ?? "kitchen"}
        error={state.fieldErrors?.storyType}
      >
        {STORY_TYPES.map((type) => (
          <option key={type} value={type}>
            {STORY_TYPE_LABELS[type]}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          name="publishedAt"
          label="Publish at"
          type="datetime-local"
          defaultValue={v?.publishedAt ?? toDatetimeLocalValue(story?.published_at)}
          hint="Leave blank to keep this as a draft."
          error={state.fieldErrors?.publishedAt}
        />
        <TextField
          name="expiresAt"
          label="Expires at (optional)"
          type="datetime-local"
          defaultValue={v?.expiresAt ?? toDatetimeLocalValue(story?.expires_at)}
          hint="Leave blank for no expiry."
          error={state.fieldErrors?.expiresAt}
        />
      </div>

      <CheckboxField
        name="isActive"
        label="Active — eligible to appear on /stories once published"
        defaultChecked={story?.is_active ?? true}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{story ? "Save changes" : "Create story"}</SubmitButton>
        <Link href="/admin/stories" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
