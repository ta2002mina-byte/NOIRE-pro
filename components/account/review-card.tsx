"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteReviewButton } from "@/components/account/delete-review-button";
import { ReviewForm } from "@/components/account/review-form";
import { updateReviewAction } from "@/lib/actions/reviews";
import { REVIEW_STATUS_LABELS } from "@/lib/constants/labels";
import type { CustomerReview } from "@/lib/data/reviews";
import type { DishOption } from "@/lib/data/journal";
import { formatDateTime } from "@/lib/utils/format";

const STATUS_TONE: Record<string, "default" | "claret" | "outline"> = {
  pending: "outline",
  published: "claret",
  hidden: "outline",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`Rated ${rating} out of 5`} className="text-sm tracking-wide text-claret">
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewCard({ review, dishOptions }: { review: CustomerReview; dishOptions: DishOption[] }) {
  const [editing, setEditing] = React.useState(false);
  const updateThisReview = updateReviewAction.bind(null, review.id);

  if (editing) {
    return (
      <li className="rounded-2xl border border-line bg-raised p-5">
        <ReviewForm
          action={updateThisReview}
          dishOptions={dishOptions}
          review={review}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          onCancel={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-line bg-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl text-ivory">
            {review.menu_item ? (
              <Link href={`/menu/${review.menu_item.slug}`} className="hover:underline">
                {review.menu_item.name}
              </Link>
            ) : (
              "NOIRÉ overall"
            )}
          </p>
          <p className="mt-1 text-sm text-mute">{formatDateTime(review.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {review.is_verified_visit ? <Badge tone="outline">Verified visit</Badge> : null}
          <Badge tone={STATUS_TONE[review.status] ?? "outline"}>{REVIEW_STATUS_LABELS[review.status] ?? review.status}</Badge>
        </div>
      </div>

      <div className="mt-3">
        <Stars rating={review.rating} />
      </div>

      {review.title ? <p className="mt-3 font-display text-lg text-ivory">{review.title}</p> : null}
      {review.body ? <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-ivory">{review.body}</p> : null}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <DeleteReviewButton reviewId={review.id} />
      </div>
    </li>
  );
}
