import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublishedDishReview } from "@/lib/data/reviews";
import { formatDateLong } from "@/lib/utils/format";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= rating ? "h-4 w-4 fill-ivory text-ivory" : "h-4 w-4 text-line"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** Approved guest reviews for one dish. Renders nothing when there are none —
 * no placeholder ratings are ever invented. */
export function DishReviews({ reviews }: { reviews: PublishedDishReview[] }) {
  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="dish-reviews-heading" className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="dish-reviews-heading" className="text-2xl">
          Guest reviews
        </h2>
        <p className="text-sm text-mute">
          {average.toFixed(1)} average · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Stars rating={review.rating} />
              {review.is_verified_visit ? <Badge tone="outline">Verified visit</Badge> : null}
              <span className="text-xs text-mute">{formatDateLong(review.created_at)}</span>
            </div>
            {review.title ? <h3 className="mt-3 text-base text-ivory">{review.title}</h3> : null}
            {review.body ? <p className="mt-2 whitespace-pre-line text-sm text-mute">{review.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
