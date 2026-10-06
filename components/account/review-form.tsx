"use client";

import { useActionState, useEffect } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/actions/state";
import type { CustomerReview } from "@/lib/data/reviews";
import type { DishOption } from "@/lib/data/journal";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

interface ReviewFormProps {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  dishOptions: DishOption[];
  review?: CustomerReview;
  submitLabel: string;
  pendingLabel: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

/** Create and edit share this form. On edit, which dish the review is about can't
 * be changed (the database enforces this too), so the field is shown read-only. */
export function ReviewForm({ action, dishOptions, review, submitLabel, pendingLabel, onCancel, onSuccess }: ReviewFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
    // Only re-run when a new submission result arrives, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage state={state} />

      {review ? (
        <>
          <input type="hidden" name="menuItemId" value={review.menu_item_id ?? ""} />
          <p className="text-sm text-mute">
            About: <span className="text-ivory">{review.menu_item?.name ?? "NOIRÉ overall"}</span>
          </p>
        </>
      ) : (
        <SelectField
          name="menuItemId"
          label="What is this review about?"
          defaultValue={v?.menuItemId ?? ""}
          error={state.fieldErrors?.menuItemId}
        >
          <option value="">NOIRÉ overall</option>
          {dishOptions.map((dish) => (
            <option key={dish.id} value={dish.id}>
              {dish.name}
            </option>
          ))}
        </SelectField>
      )}

      <SelectField
        name="rating"
        label="Rating"
        required
        defaultValue={v?.rating ?? review?.rating?.toString() ?? ""}
        error={state.fieldErrors?.rating}
      >
        <option value="" disabled>
          Choose a rating
        </option>
        {RATING_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {"★".repeat(n)} ({n})
          </option>
        ))}
      </SelectField>

      <TextField
        name="title"
        label="Title (optional)"
        placeholder="Sum it up in a few words"
        maxLength={200}
        defaultValue={v?.title ?? review?.title ?? ""}
        error={state.fieldErrors?.title}
      />

      <TextareaField
        name="body"
        label="Your review (optional)"
        placeholder="What stood out about the dish or the evening?"
        maxLength={4000}
        defaultValue={v?.body ?? review?.body ?? ""}
        error={state.fieldErrors?.body}
      />

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
        {onCancel ? (
          <Button type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
