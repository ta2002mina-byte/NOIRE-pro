import { ReviewForm } from "@/components/account/review-form";
import { createReviewAction } from "@/lib/actions/reviews";
import type { DishOption } from "@/lib/data/journal";

export function ReviewAddForm({ dishOptions }: { dishOptions: DishOption[] }) {
  return (
    <div className="rounded-2xl border border-line bg-raised p-5 sm:p-6">
      <h2 className="font-display text-xl text-ivory">Write a review</h2>
      <p className="mt-1 text-sm text-mute">
        Reviews are checked before they go live, so it may take a little while to appear.
      </p>
      <div className="mt-5">
        <ReviewForm action={createReviewAction} dishOptions={dishOptions} submitLabel="Submit review" pendingLabel="Submitting…" />
      </div>
    </div>
  );
}
