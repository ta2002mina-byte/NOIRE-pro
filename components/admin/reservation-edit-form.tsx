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
import { OCCASIONS, RESERVATION_STATUS_LABELS, SEATING_PREFERENCES } from "@/lib/constants/reservation";
import { RESERVATION_STATUSES } from "@/lib/validations/reservation";
import type { AdminReservation, ReservationTable } from "@/lib/data/reservation";
import type { DiningExperience } from "@/lib/data/experiences";

interface ReservationEditFormProps {
  reservation: AdminReservation;
  tables: ReservationTable[];
  experiences: DiningExperience[];
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

export function ReservationEditForm({ reservation, tables, experiences, action }: ReservationEditFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;
  const selectedPreferences = new Set(
    reservation.reservation_preferences.map((p) => p.preference),
  );

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <TextField
          name="date"
          label="Date"
          type="date"
          required
          defaultValue={v?.date ?? reservation.reservation_date}
          error={state.fieldErrors?.date}
        />
        <TextField
          name="time"
          label="Time"
          type="time"
          required
          defaultValue={v?.time ?? reservation.reservation_time.slice(0, 5)}
          error={state.fieldErrors?.time}
        />
        <TextField
          name="guestCount"
          label="Guests"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          required
          defaultValue={v?.guestCount ?? reservation.guest_count.toString()}
          error={state.fieldErrors?.guestCount}
        />
      </div>

      <SelectField
        name="status"
        label="Status"
        defaultValue={v?.status ?? reservation.status}
        error={state.fieldErrors?.status}
      >
        {RESERVATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {RESERVATION_STATUS_LABELS[status]}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          name="tableId"
          label="Table"
          defaultValue={v?.tableId ?? reservation.table_id ?? ""}
          hint="Clearing this leaves the reservation unassigned."
          error={state.fieldErrors?.tableId}
        >
          <option value="">No table assigned</option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              Table {table.label} — seats {table.min_capacity}–{table.capacity}
              {!table.is_active ? " (inactive)" : ""}
            </option>
          ))}
        </SelectField>

        <SelectField
          name="experienceId"
          label="Experience"
          defaultValue={v?.experienceId ?? reservation.experience_id ?? ""}
          error={state.fieldErrors?.experienceId}
        >
          <option value="">None</option>
          {experiences.map((experience) => (
            <option key={experience.id} value={experience.id}>
              {experience.title}
              {!experience.is_active ? " (inactive)" : ""}
            </option>
          ))}
        </SelectField>
      </div>

      <SelectField
        name="occasion"
        label="Occasion"
        defaultValue={v?.occasion ?? reservation.occasion ?? ""}
        error={state.fieldErrors?.occasion}
      >
        <option value="">None</option>
        {OCCASIONS.map((occasion) => (
          <option key={occasion.value} value={occasion.value}>
            {occasion.label}
          </option>
        ))}
      </SelectField>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ivory">Seating preferences</legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          {SEATING_PREFERENCES.map((preference) => (
            <CheckboxField
              key={preference.value}
              name="preferences"
              value={preference.value}
              label={preference.label}
              defaultChecked={selectedPreferences.has(preference.value)}
            />
          ))}
        </div>
      </fieldset>

      <TextareaField
        name="specialRequest"
        label="Special request"
        maxLength={1000}
        defaultValue={v?.specialRequest ?? reservation.special_request ?? ""}
        error={state.fieldErrors?.specialRequest}
      />

      <div className="space-y-4 rounded-2xl border border-line p-5">
        <p className="text-sm text-ivory">Contact details</p>
        <p className="text-xs text-mute">
          {reservation.profiles
            ? `Signed-in guest: ${reservation.profiles.full_name ?? reservation.profiles.email ?? "—"}. These fields are only used for walk-ins without an account.`
            : "No account is linked to this reservation — these are the contact details on file."}
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <TextField
            name="contactName"
            label="Name"
            maxLength={200}
            defaultValue={v?.contactName ?? reservation.contact_name ?? ""}
            error={state.fieldErrors?.contactName}
          />
          <TextField
            name="contactPhone"
            label="Phone"
            type="tel"
            maxLength={40}
            defaultValue={v?.contactPhone ?? reservation.contact_phone ?? ""}
            error={state.fieldErrors?.contactPhone}
          />
          <TextField
            name="contactEmail"
            label="Email"
            type="email"
            defaultValue={v?.contactEmail ?? reservation.contact_email ?? ""}
            error={state.fieldErrors?.contactEmail}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        <Link href="/admin/reservations" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
