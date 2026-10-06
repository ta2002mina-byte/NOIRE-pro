"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cancelReservationAction } from "@/lib/actions/reservation";

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Cancel reservation
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-ivory">Cancel this reservation?</span>
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelReservationAction(reservationId);
              if (!result.ok) {
                setError(result.message ?? "We couldn’t cancel that reservation.");
                setConfirming(false);
              }
            })
          }
        >
          Yes, cancel
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
