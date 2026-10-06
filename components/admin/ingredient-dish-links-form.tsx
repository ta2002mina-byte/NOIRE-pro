"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setIngredientDishLinksAction } from "@/lib/actions/ingredients";
import type { MenuItemOption } from "@/lib/data/menu";

export function IngredientDishLinksForm({
  ingredientId,
  allDishes,
  linkedIds,
}: {
  ingredientId: string;
  allDishes: MenuItemOption[];
  linkedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set(linkedIds));
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Keep the checklist in sync if the server refreshes with different data underneath us.
  React.useEffect(() => {
    setSelected(new Set(linkedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedIds.join(",")]);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (allDishes.length === 0) {
    return <p className="text-sm text-mute">No dishes on the menu yet.</p>;
  }

  return (
    <div className="space-y-4">
      <fieldset className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-line p-4">
        <legend className="sr-only">Dishes using this ingredient</legend>
        {allDishes.map((dish) => (
          <label key={dish.id} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ivory">
            <input
              type="checkbox"
              checked={selected.has(dish.id)}
              onChange={() => toggle(dish.id)}
              className="h-4 w-4 shrink-0 rounded border-line bg-surface text-claret accent-claret focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
            />
            {dish.name}
            {!dish.is_available ? <span className="text-mute"> (not available tonight)</span> : null}
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          loading={pending}
          disabled={pending}
          onClick={() => {
            setError(null);
            setSaved(false);
            startTransition(async () => {
              const result = await setIngredientDishLinksAction(ingredientId, Array.from(selected));
              if (result.ok) {
                setSaved(true);
                router.refresh();
              } else {
                setError(result.message);
              }
            });
          }}
        >
          Save linked dishes
        </Button>
        {saved ? <span className="text-sm text-mute">Saved.</span> : null}
        {error ? (
          <span role="alert" className="text-sm text-danger">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
