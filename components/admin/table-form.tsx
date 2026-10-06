"use client";

import { useActionState } from "react";
import Link from "next/link";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { buttonStyles } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { TABLE_AREAS } from "@/lib/constants/reservation";
import type { AdminTable } from "@/lib/data/tables";
import { TABLE_SHAPES } from "@/lib/validations/table";

interface TableFormProps {
  table?: AdminTable;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

/** Create and edit share one form. Position and size are percentages of the floor
 * plan (0–100), the same units the guest-facing table map reads. */
export function TableForm({ table, action }: TableFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;
  const err = state.fieldErrors;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="label"
          label="Label"
          placeholder="T1"
          required
          maxLength={40}
          defaultValue={v?.label ?? table?.label ?? ""}
          error={err?.label}
        />
        <SelectField name="area" label="Area" defaultValue={v?.area ?? table?.area ?? "main_hall"} error={err?.area}>
          {TABLE_AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <TextField
          name="minCapacity"
          label="Minimum guests"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          required
          defaultValue={v?.minCapacity ?? String(table?.min_capacity ?? 1)}
          error={err?.minCapacity}
        />
        <TextField
          name="capacity"
          label="Maximum guests"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          required
          defaultValue={v?.capacity ?? String(table?.capacity ?? 2)}
          error={err?.capacity}
        />
        <SelectField name="shape" label="Shape" defaultValue={v?.shape ?? table?.shape ?? "round"} error={err?.shape}>
          {TABLE_SHAPES.map((shape) => (
            <option key={shape.value} value={shape.value}>
              {shape.label}
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm text-ivory">Floor plan placement</legend>
        <p className="text-sm text-mute">Percentages of the floor plan: 0 is the top-left corner, 100 the opposite edge.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="posX"
            label="Left (%)"
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={100}
            required
            defaultValue={v?.posX ?? String(table?.pos_x ?? 10)}
            error={err?.posX}
          />
          <TextField
            name="posY"
            label="Top (%)"
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={100}
            required
            defaultValue={v?.posY ?? String(table?.pos_y ?? 10)}
            error={err?.posY}
          />
          <TextField
            name="width"
            label="Width (%)"
            type="number"
            inputMode="decimal"
            step="0.5"
            min={1}
            max={100}
            required
            defaultValue={v?.width ?? String(table?.width ?? 8)}
            error={err?.width}
          />
          <TextField
            name="height"
            label="Height (%)"
            type="number"
            inputMode="decimal"
            step="0.5"
            min={1}
            max={100}
            required
            defaultValue={v?.height ?? String(table?.height ?? 8)}
            error={err?.height}
          />
        </div>
      </fieldset>

      <TextareaField
        name="notes"
        label="Notes (optional)"
        placeholder="Near the window, step-free access…"
        maxLength={300}
        defaultValue={v?.notes ?? table?.notes ?? ""}
        error={err?.notes}
      />

      <CheckboxField
        name="isActive"
        label="Active — guests can book this table"
        defaultChecked={table?.is_active ?? true}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{table ? "Save changes" : "Create table"}</SubmitButton>
        <Link href="/admin/tables" className={buttonStyles({ variant: "outline" })}>
          Back to tables
        </Link>
      </div>
    </form>
  );
}
