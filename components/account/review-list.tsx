import { ReviewCard } from "@/components/account/review-card";
import type { CustomerReview } from "@/lib/data/reviews";
import type { DishOption } from "@/lib/data/journal";

export function ReviewList({ reviews, dishOptions }: { reviews: CustomerReview[]; dishOptions: DishOption[] }) {
  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} dishOptions={dishOptions} />
      ))}
    </ul>
  );
}
