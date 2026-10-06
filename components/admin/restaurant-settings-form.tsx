"use client";

import { useActionState } from "react";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { OPENING_HOURS_DAYS } from "@/lib/validations/restaurant-settings";
import type { Restaurant } from "@/lib/data/restaurant";

interface RestaurantSettingsFormProps {
  restaurant: Restaurant | null;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

function openingHoursValue(restaurant: Restaurant | null, key: string): string {
  const hours = restaurant?.opening_hours;
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return "";
  const value = (hours as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function RestaurantSettingsForm({ restaurant, action }: RestaurantSettingsFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-10">
      <FormMessage state={state} />

      <section className="space-y-6">
        <h2 className="font-display text-lg text-ivory">Restaurant details</h2>

        <TextField
          name="name"
          label="Name"
          required
          maxLength={160}
          defaultValue={v?.name ?? restaurant?.name ?? ""}
          error={state.fieldErrors?.name}
        />

        <TextField
          name="tagline"
          label="Tagline (optional)"
          placeholder="A short line shown near the restaurant name."
          maxLength={200}
          defaultValue={v?.tagline ?? restaurant?.tagline ?? ""}
          error={state.fieldErrors?.tagline}
        />

        <TextareaField
          name="description"
          label="Description (optional)"
          placeholder="Shown on the About page."
          maxLength={2000}
          defaultValue={v?.description ?? restaurant?.description ?? ""}
          error={state.fieldErrors?.description}
        />

        <CheckboxField
          name="isActive"
          label="Active — the public site shows this restaurant"
          defaultChecked={restaurant?.is_active ?? true}
        />
      </section>

      <section className="space-y-6 border-t border-line pt-8">
        <h2 className="font-display text-lg text-ivory">Location &amp; contact</h2>

        <TextField
          name="addressLine"
          label="Address (optional)"
          maxLength={200}
          defaultValue={v?.addressLine ?? restaurant?.address_line ?? ""}
          error={state.fieldErrors?.addressLine}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            name="city"
            label="City (optional)"
            maxLength={100}
            defaultValue={v?.city ?? restaurant?.city ?? ""}
            error={state.fieldErrors?.city}
          />
          <TextField
            name="region"
            label="Region / state (optional)"
            maxLength={100}
            defaultValue={v?.region ?? restaurant?.region ?? ""}
            error={state.fieldErrors?.region}
          />
          <TextField
            name="postalCode"
            label="Postal code (optional)"
            maxLength={20}
            defaultValue={v?.postalCode ?? restaurant?.postal_code ?? ""}
            error={state.fieldErrors?.postalCode}
          />
          <TextField
            name="country"
            label="Country (optional)"
            maxLength={100}
            defaultValue={v?.country ?? restaurant?.country ?? ""}
            error={state.fieldErrors?.country}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            name="latitude"
            label="Latitude (optional)"
            type="number"
            step="any"
            min={-90}
            max={90}
            defaultValue={v?.latitude ?? restaurant?.latitude?.toString() ?? ""}
            error={state.fieldErrors?.latitude}
          />
          <TextField
            name="longitude"
            label="Longitude (optional)"
            type="number"
            step="any"
            min={-180}
            max={180}
            defaultValue={v?.longitude ?? restaurant?.longitude?.toString() ?? ""}
            error={state.fieldErrors?.longitude}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            name="phone"
            label="Phone (optional)"
            type="tel"
            maxLength={40}
            defaultValue={v?.phone ?? restaurant?.phone ?? ""}
            error={state.fieldErrors?.phone}
          />
          <TextField
            name="email"
            label="Email (optional)"
            type="email"
            defaultValue={v?.email ?? restaurant?.email ?? ""}
            error={state.fieldErrors?.email}
          />
        </div>
      </section>

      <section className="space-y-6 border-t border-line pt-8">
        <h2 className="font-display text-lg text-ivory">Opening hours</h2>
        <p className="text-sm text-mute">
          Free text per day, e.g. &ldquo;18:00–23:00&rdquo;. Leave a day blank to show it as closed.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OPENING_HOURS_DAYS.map(({ key, label }) => (
            <TextField
              key={key}
              name={`hours_${key}`}
              label={label}
              placeholder="Closed"
              maxLength={60}
              defaultValue={v?.[`hours_${key}`] ?? openingHoursValue(restaurant, key)}
              error={state.fieldErrors?.[`hours_${key}`]}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6 border-t border-line pt-8">
        <h2 className="font-display text-lg text-ivory">Reservation rules</h2>

        <TextField
          name="reservationDurationMinutes"
          label="Default seating length (minutes)"
          type="number"
          inputMode="numeric"
          min={30}
          max={480}
          required
          defaultValue={v?.reservationDurationMinutes ?? restaurant?.reservation_duration_minutes?.toString() ?? "120"}
          hint="Used when a reservation doesn't specify its own duration."
          error={state.fieldErrors?.reservationDurationMinutes}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            name="timezone"
            label="Time zone"
            required
            placeholder="America/New_York"
            maxLength={80}
            defaultValue={v?.timezone ?? restaurant?.timezone ?? "UTC"}
            hint="An IANA time zone name."
            error={state.fieldErrors?.timezone}
          />
          <TextField
            name="currency"
            label="Currency"
            required
            placeholder="USD"
            maxLength={3}
            defaultValue={v?.currency ?? restaurant?.currency ?? "USD"}
            hint="A 3-letter currency code."
            error={state.fieldErrors?.currency}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
