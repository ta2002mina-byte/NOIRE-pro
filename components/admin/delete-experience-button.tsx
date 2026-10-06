"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteExperienceAction } from "@/lib/actions/experiences";

export function DeleteExperienceButton({ id, title }: { id: string; title: string }) {
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

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-ivory">Delete “{title}”?</span>
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteExperienceAction(id);
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
