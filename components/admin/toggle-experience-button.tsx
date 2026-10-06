"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toggleExperienceActiveAction } from "@/lib/actions/experiences";

export function ToggleExperienceActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        loading={pending}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleExperienceActiveAction(id, !isActive);
            if (result.ok) {
              router.refresh();
            } else {
              setError(result.message);
            }
          });
        }}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
