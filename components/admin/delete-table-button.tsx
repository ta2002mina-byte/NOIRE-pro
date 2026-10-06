"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteTableAction } from "@/lib/actions/tables";

export function DeleteTableButton({ id, label, redirectTo }: { id: string; label: string; redirectTo?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
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
        {error ? (
          <p role="alert" className="max-w-xs text-right text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ivory">Delete table “{label}”?</span>
      <Button
        variant="primary"
        size="sm"
        loading={pending}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteTableAction(id);
            if (result.ok) {
              if (redirectTo) router.push(redirectTo);
              else router.refresh();
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
  );
}
