import type { Metadata } from "next";

import { ReviewAddForm } from "@/components/account/review-add-form";
import { ReviewList } from "@/components/account/review-list";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getDishOptions } from "@/lib/data/journal";
import { getCustomerReviews } from "@/lib/data/reviews";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Reviews" };

export default async function Page() {
  const ctx = await requireAccess("/account/reviews");
  const restaurant = await getRestaurant();

  const [reviews, dishOptions] = await Promise.all([
    getCustomerReviews(ctx.user.id),
    restaurant ? getDishOptions(restaurant.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-ivory">Reviews</h1>
        <p className="mt-1 text-sm text-mute">
          Reviews you&rsquo;ve written, about NOIRÉ or a specific dish. New reviews are checked before they&rsquo;re
          published.
        </p>
      </div>

      <ReviewAddForm dishOptions={dishOptions} />

      {reviews.length === 0 ? (
        <EmptyState
          title="You haven't written a review yet"
          description="Share what you thought after your next visit — about the evening overall, or a dish you tried."
        />
      ) : (
        <ReviewList reviews={reviews} dishOptions={dishOptions} />
      )}
    </div>
  );
}
