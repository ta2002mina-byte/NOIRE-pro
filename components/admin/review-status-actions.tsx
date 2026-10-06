"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setReviewStatusAction } from "@/lib/actions/reviews";
import type { ReviewStatus } from "@/lib/validations/review";

/** The status-appropriate next actions — never more than two, so the row stays scannable. */
function actionsFor(status: string): { label: string; next: ReviewStatus }[] {
  switch (status) {
    case "pending":
      return [
        { label: "Publish", next: "published" },
        { label: "Hide", next: "hidden" },
      ];
    case "published":
      return [{ label: "Hide", next: "hidden" }];
    case "hidden":
      return [
        { label: "Publish", next: "published" },
        { label: "Back to pending", next: "pending" },
      ];
    default:
      return [];
  }
}

export function ReviewStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [pendingLabel, setPendingLabel] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {actionsFor(status).map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            loading={pending && pendingLabel === action.label}
            disabled={pending}
            onClick={() => {
              setError(null);
              setPendingLabel(action.label);
              startTransition(async () => {
                const result = await setReviewStatusAction(id, action.next);
                if (result.ok) {
                  router.refresh();
                } else {
                  setError(result.message);
                }
              });
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
