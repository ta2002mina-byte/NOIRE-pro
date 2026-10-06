import type { Metadata } from "next";
import Link from "next/link";

import { ReviewModerationCard } from "@/components/admin/review-moderation-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAccess } from "@/lib/auth/session";
import { REVIEW_STATUS_LABELS } from "@/lib/constants/labels";
import { getReviewsForAdmin, getReviewStatusCounts } from "@/lib/data/reviews";
import { getRestaurant } from "@/lib/data/restaurant";
import { isReviewStatus, type ReviewStatus } from "@/lib/validations/review";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

const PAGE_SIZE = 15;

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  await requireAccess("/admin/reviews");
  const params = await searchParams;
  const status: ReviewStatus | undefined = isReviewStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const restaurant = await getRestaurant();

  let reviews: Awaited<ReturnType<typeof getReviewsForAdmin>>["reviews"] = [];
  let total = 0;
  let counts: Record<ReviewStatus, number> = { pending: 0, published: 0, hidden: 0 };

  if (restaurant) {
    const [reviewPage, statusCounts] = await Promise.all([
      getReviewsForAdmin(restaurant.id, { status, page, pageSize: PAGE_SIZE }),
      getReviewStatusCounts(restaurant.id),
    ]);
    reviews = reviewPage.reviews;
    total = reviewPage.total;
    counts = statusCounts;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allTotal = counts.pending + counts.published + counts.hidden;

  const tabs: { value: ReviewStatus | ""; label: string; count: number }[] = [
    { value: "", label: "All", count: allTotal },
    { value: "pending", label: REVIEW_STATUS_LABELS.pending, count: counts.pending },
    { value: "published", label: REVIEW_STATUS_LABELS.published, count: counts.published },
    { value: "hidden", label: REVIEW_STATUS_LABELS.hidden, count: counts.hidden },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Reviews</h1>
        <p className="mt-2 max-w-prose text-mute">
          Guest reviews of NOIRÉ and individual dishes. New reviews start pending — publish the ones you want shown,
          or hide them.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {tabs.map((tab) => (
          <Link
            key={tab.value || "all"}
            href={tab.value ? `/admin/reviews?status=${tab.value}` : "/admin/reviews"}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              (status ?? "") === tab.value ? "border-ivory bg-raised text-ivory" : "border-line text-mute hover:border-ivory/60",
            )}
          >
            {tab.label} <span className="text-xs text-mute">({tab.count})</span>
          </Link>
        ))}
      </nav>

      {!restaurant ? (
        <EmptyState title="No restaurant record yet." description="Reviews are attached to a restaurant." />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews here."
          description={status ? "Nothing with this status yet." : "Guest reviews will appear here once submitted."}
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        itemLabel="reviews"
        basePath="/admin/reviews"
        params={{ status: status ?? "" }}
      />
    </div>
  );
}
