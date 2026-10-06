"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type SimpleResult = { ok: true } | { ok: false; message: string };

interface ConfirmActionButtonProps {
  /** Shown on the initial button, e.g. "Delete". */
  label: string;
  /** Shown next to the confirm/cancel pair, e.g. `Delete "Romantic Dinner"?`. */
  confirmMessage: string;
  /** Label for the confirming button, e.g. "Yes, delete". Defaults to `label`. */
  confirmLabel?: string;
  action: () => Promise<SimpleResult>;
  danger?: boolean;
}

/** A destructive action that asks for one explicit confirm click before it fires —
 * the "delete" family of admin actions, shared across every admin section. */
export function ConfirmActionButton({ label, confirmMessage, confirmLabel, action, danger = true }: ConfirmActionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={danger ? "text-danger hover:text-danger" : undefined}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-ivory">{confirmMessage}</span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await action();
              if (result.ok) {
                router.refresh();
              } else {
                setError(result.message);
                setConfirming(false);
              }
            })
          }
        >
          {confirmLabel ?? label}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
          Cancel
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
