"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { adminSetReservationStatusAction } from "@/lib/actions/reservation";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants/reservation";
import { RESERVATION_STATUSES, type ReservationStatus } from "@/lib/validations/reservation";
import { cn } from "@/lib/utils";

/** Inline status change from the reservation list — commits on selection, no separate save step. */
export function ReservationStatusSelect({ id, status }: { id: string; status: ReservationStatus }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [value, setValue] = React.useState(status);

  return (
    <div className="flex flex-col items-start gap-1">
      <select
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as ReservationStatus;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await adminSetReservationStatusAction(id, next);
            if (result.ok) {
              router.refresh();
            } else {
              setValue(previous);
              setError(result.message);
            }
          });
        }}
        className={cn(
          "h-9 rounded-full border border-line bg-surface px-3 text-xs text-ivory transition-colors",
          "hover:border-ivory/30 focus-visible:border-ivory/60 disabled:opacity-50",
        )}
      >
        {RESERVATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {RESERVATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
