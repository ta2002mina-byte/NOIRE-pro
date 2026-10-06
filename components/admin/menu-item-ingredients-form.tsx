"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setMenuItemIngredientLinksAction } from "@/lib/actions/menu";
import type { IngredientOption } from "@/lib/data/ingredients";

export function MenuItemIngredientsForm({
  menuItemId,
  allIngredients,
  linkedIds,
}: {
  menuItemId: string;
  allIngredients: IngredientOption[];
  linkedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set(linkedIds));
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

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

  if (allIngredients.length === 0) {
    return <p className="text-sm text-mute">No ingredients recorded yet — add some under Ingredients first.</p>;
  }

  return (
    <div className="space-y-4">
      <fieldset className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-line p-4">
        <legend className="sr-only">Ingredients used in this dish</legend>
        {allIngredients.map((ingredient) => (
          <label key={ingredient.id} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ivory">
            <input
              type="checkbox"
              checked={selected.has(ingredient.id)}
              onChange={() => toggle(ingredient.id)}
              className="h-4 w-4 shrink-0 rounded border-line bg-surface text-claret accent-claret focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
            />
            {ingredient.name}
            {!ingredient.is_active ? <span className="text-mute"> (inactive)</span> : null}
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
              const result = await setMenuItemIngredientLinksAction(menuItemId, Array.from(selected));
              if (result.ok) {
                setSaved(true);
                router.refresh();
              } else {
                setError(result.message);
              }
            });
          }}
        >
          Save linked ingredients
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
