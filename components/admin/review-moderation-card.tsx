import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DeleteReviewButton } from "@/components/admin/delete-review-button";
import { ReviewStatusActions } from "@/components/admin/review-status-actions";
import { REVIEW_STATUS_LABELS } from "@/lib/constants/labels";
import type { AdminReview } from "@/lib/data/reviews";
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

export function ReviewModerationCard({ review }: { review: AdminReview }) {
  return (
    <li className="rounded-2xl border border-line bg-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-ivory">
            {review.menu_item ? (
              <Link href={`/menu/${review.menu_item.slug}`} className="hover:underline">
                {review.menu_item.name}
              </Link>
            ) : (
              "NOIRÉ overall"
            )}
          </p>
          <p className="mt-1 text-sm text-mute">
            {review.customer?.full_name ?? review.customer?.email ?? "A guest"} · {formatDateTime(review.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {review.is_verified_visit ? <Badge tone="outline">Verified visit</Badge> : null}
          <Badge tone={STATUS_TONE[review.status] ?? "outline"}>{REVIEW_STATUS_LABELS[review.status] ?? review.status}</Badge>
        </div>
      </div>

      <div className="mt-3">
        <Stars rating={review.rating} />
      </div>

      {review.title ? <p className="mt-3 font-display text-base text-ivory">{review.title}</p> : null}
      {review.body ? <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-mute">{review.body}</p> : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <ReviewStatusActions id={review.id} status={review.status} />
        <DeleteReviewButton id={review.id} />
      </div>
    </li>
  );
}
