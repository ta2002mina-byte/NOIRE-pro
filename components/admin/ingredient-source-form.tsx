"use client";

import { useActionState, useEffect } from "react";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { SOURCE_TYPE_LABELS } from "@/lib/constants/labels";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { SOURCE_TYPES } from "@/lib/validations/ingredient-source";
import type { IngredientSource } from "@/lib/data/ingredients";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface IngredientSourceFormProps {
  source?: IngredientSource;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  onCancel?: () => void;
  /** Called once the save succeeds — lets the edit panel collapse back to the summary row. */
  onSaved?: () => void;
}

export function IngredientSourceForm({ source, action, onCancel, onSaved }: IngredientSourceFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);

  useEffect(() => {
    if (state.status === "success") onSaved?.();
    // Only re-run when the status changes to success — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return (
    <form action={formAction} noValidate className="space-y-4 rounded-xl border border-line p-4">
      <FormMessage state={state} />

      <TextField
        name="sourceName"
        label="Source name"
        placeholder="Green Hollow Farm"
        required
        maxLength={160}
        defaultValue={source?.source_name ?? ""}
        error={state.fieldErrors?.sourceName}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          name="sourceType"
          label="Type (optional)"
          defaultValue={source?.source_type ?? ""}
          error={state.fieldErrors?.sourceType}
        >
          <option value="">Not specified</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SOURCE_TYPE_LABELS[t]}
            </option>
          ))}
        </SelectField>

        <TextField
          name="location"
          label="Location (optional)"
          placeholder="Sonoma County, CA"
          maxLength={160}
          defaultValue={source?.location ?? ""}
          error={state.fieldErrors?.location}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          name="seasonStartMonth"
          label="Season starts (optional)"
          defaultValue={source?.season_start_month?.toString() ?? ""}
          error={state.fieldErrors?.seasonStartMonth}
        >
          <option value="">—</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </SelectField>

        <SelectField
          name="seasonEndMonth"
          label="Season ends (optional)"
          defaultValue={source?.season_end_month?.toString() ?? ""}
          error={state.fieldErrors?.seasonEndMonth}
        >
          <option value="">—</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </SelectField>

        <TextField
          name="harvestDate"
          label="Harvest date (optional)"
          type="date"
          defaultValue={source?.harvest_date ?? ""}
          error={state.fieldErrors?.harvestDate}
        />
      </div>

      <TextareaField
        name="notes"
        label="Notes (optional)"
        maxLength={600}
        defaultValue={source?.notes ?? ""}
        error={state.fieldErrors?.notes}
      />

      <CheckboxField
        name="isPublished"
        label="Published — visible on /our-ingredients"
        defaultChecked={source?.is_published ?? false}
      />

      <div className="flex flex-wrap gap-3 pt-1">
        <SubmitButton pendingLabel="Saving…">{source ? "Save source" : "Add source"}</SubmitButton>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
