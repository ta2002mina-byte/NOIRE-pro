"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteIngredientAction } from "@/lib/actions/ingredients";

export function DeleteIngredientButton({
  id,
  name,
  sourceCount = 0,
  dishCount = 0,
}: {
  id: string;
  name: string;
  sourceCount?: number;
  dishCount?: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-danger hover:text-danger"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Delete
      </Button>
    );
  }

  const impact = sourceCount > 0 || dishCount > 0;

  return (
    <div className="flex flex-col items-end gap-2">
      {impact ? (
        <p className="max-w-xs text-right text-xs text-mute">
          This also removes {sourceCount > 0 ? `${sourceCount} sourcing ${sourceCount === 1 ? "entry" : "entries"}` : ""}
          {sourceCount > 0 && dishCount > 0 ? " and " : ""}
          {dishCount > 0 ? `its link to ${dishCount} ${dishCount === 1 ? "dish" : "dishes"}` : ""}.
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="text-sm text-ivory">Delete “{name}”?</span>
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteIngredientAction(id);
              if (result.ok) {
                router.refresh();
              } else {
                setError(result.message);
                setConfirming(false);
              }
            })
          }
        >
          Yes, delete
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
          Keep it
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
