"use client";

import { useActionState, useEffect } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/actions/state";
import type { DishOption, JournalEntry } from "@/lib/data/journal";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

interface JournalEntryFormProps {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  dishOptions: DishOption[];
  entry?: JournalEntry;
  submitLabel: string;
  pendingLabel: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

/** Create and edit share this form; only the bound server action and defaults differ. */
export function JournalEntryForm({
  action,
  dishOptions,
  entry,
  submitLabel,
  pendingLabel,
  onCancel,
  onSuccess,
}: JournalEntryFormProps) {
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

      <SelectField
        name="menuItemId"
        label="Dish (optional)"
        defaultValue={v?.menuItemId ?? entry?.menu_item_id ?? ""}
        error={state.fieldErrors?.menuItemId}
      >
        <option value="">Not on the menu / other</option>
        {dishOptions.map((dish) => (
          <option key={dish.id} value={dish.id}>
            {dish.name}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          name="visitedAt"
          label="Date"
          type="date"
          required
          max={todayLocal()}
          defaultValue={v?.visitedAt ?? entry?.visited_at ?? todayLocal()}
          error={state.fieldErrors?.visitedAt}
        />

        <SelectField
          name="rating"
          label="Rating (optional)"
          defaultValue={v?.rating ?? entry?.rating?.toString() ?? ""}
          error={state.fieldErrors?.rating}
        >
          <option value="">No rating</option>
          {RATING_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </SelectField>
      </div>

      <TextareaField
        name="personalNote"
        label="Your note (optional)"
        placeholder="What did you think? Anything you’d want to remember next time."
        maxLength={4000}
        defaultValue={v?.personalNote ?? entry?.personal_note ?? ""}
        error={state.fieldErrors?.personalNote}
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
