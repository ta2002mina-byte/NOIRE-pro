"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setDishPreferenceAction } from "@/lib/actions/menu";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";
import type { DishPreference } from "@/lib/data/menu";

/** Recommendation attributes power the mood menu filter and Find My Dish. One row
 * per dish is enough for most cases, so this form replaces the whole set on save
 * rather than managing several rows — see setDishPreferenceAction. */
export function DishPreferenceForm({ menuItemId, preference }: { menuItemId: string; preference: DishPreference | null }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await setDishPreferenceAction(menuItemId, formData);
          if (result.ok) {
            setSaved(true);
            router.refresh();
          } else {
            setError(result.message);
          }
        });
      }}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="pref-mood" className="block text-sm text-ivory">
            Mood
          </label>
          <select
            id="pref-mood"
            name="mood"
            defaultValue={preference?.mood ?? ""}
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ivory hover:border-ivory/30 focus-visible:border-ivory/60"
          >
            <option value="">None</option>
            {MOOD_FILTERS.map((mood) => (
              <option key={mood.value} value={mood.value}>
                {mood.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="pref-spice" className="block text-sm text-ivory">
            Spice level
          </label>
          <select
            id="pref-spice"
            name="prefSpiceLevel"
            defaultValue={preference?.spice_level?.toString() ?? ""}
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ivory hover:border-ivory/30 focus-visible:border-ivory/60"
          >
            <option value="">Same as the dish&rsquo;s spice level</option>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="pref-flavor" className="block text-sm text-ivory">
            Flavor
          </label>
          <input
            id="pref-flavor"
            name="flavor"
            defaultValue={preference?.flavor ?? ""}
            placeholder="Umami, citrus…"
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ivory placeholder:text-mute/70 hover:border-ivory/30 focus-visible:border-ivory/60"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pref-texture" className="block text-sm text-ivory">
            Texture
          </label>
          <input
            id="pref-texture"
            name="texture"
            defaultValue={preference?.texture ?? ""}
            placeholder="Crisp, silky…"
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ivory placeholder:text-mute/70 hover:border-ivory/30 focus-visible:border-ivory/60"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pref-meal" className="block text-sm text-ivory">
            Meal type
          </label>
          <input
            id="pref-meal"
            name="mealType"
            defaultValue={preference?.meal_type ?? ""}
            placeholder="Starter, main…"
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ivory placeholder:text-mute/70 hover:border-ivory/30 focus-visible:border-ivory/60"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pref-occasion" className="block text-sm text-ivory">
          Occasion
        </label>
        <input
          id="pref-occasion"
          name="occasion"
          defaultValue={preference?.occasion ?? ""}
          placeholder="Date night, celebration…"
          className="h-12 w-full max-w-sm rounded-xl border border-line bg-surface px-4 text-sm text-ivory placeholder:text-mute/70 hover:border-ivory/30 focus-visible:border-ivory/60"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending} disabled={pending}>
          Save recommendation attributes
        </Button>
        {saved ? <span className="text-sm text-mute">Saved.</span> : null}
        {error ? (
          <span role="alert" className="text-sm text-danger">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
