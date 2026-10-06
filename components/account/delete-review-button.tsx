"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { deleteReviewAction } from "@/lib/actions/reviews";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
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
        <span className="text-sm text-ivory">Delete this review?</span>
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteReviewAction(reviewId);
              if (!result.ok) {
                setError(result.message ?? "We couldn’t delete that review.");
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
