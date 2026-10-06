import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getCustomerDetail } from "@/lib/data/customers";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Customer" };

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  await requireAccess("/admin/customers");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const detail = restaurant ? await getCustomerDetail(restaurant.id, id) : null;
  if (!detail) notFound();

  const { profile, visits, dishesTried, favorites, reviews, favoriteExperience, lastVisitDate } = detail;

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl">{profile.full_name ?? "Unnamed guest"}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute">
          {profile.email ? <span>{profile.email}</span> : null}
          {profile.phone ? <span>{profile.phone}</span> : null}
          <span>Joined {formatDate(profile.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-line p-4">
          <p className="text-2xl text-ivory">{visits.length}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-mute">Visits</p>
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="text-2xl text-ivory">{dishesTried.length}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-mute">Dishes tried</p>
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="text-lg text-ivory">{formatDate(lastVisitDate)}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-mute">Last visit</p>
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="text-lg text-ivory">{favoriteExperience ?? "—"}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-mute">Favorite experience</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl text-ivory">Visit history</h2>
        {visits.length === 0 ? (
          <EmptyState title="No verified visits yet." description="A visit is recorded once staff mark a reservation completed." />
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {visits.map((visit) => (
              <li key={visit.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-ivory">{formatDate(visit.visit_date)}</span>
                <span className="text-mute">
                  {visit.guest_count ? `${visit.guest_count} guests` : ""}
                  {visit.experience_title ? ` · ${visit.experience_title}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl text-ivory">Dishes tried</h2>
        {dishesTried.length === 0 ? (
          <EmptyState title="No journal entries yet." description="Shown once the customer logs a dish in their dining journal." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {dishesTried.map((dish) => (
              <li key={`${dish.id}-${dish.visited_at}`}>
                <Badge tone="outline">
                  {dish.name}
                  {dish.rating ? ` · ${dish.rating}★` : ""}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl text-ivory">Favorites</h2>
        {favorites.length === 0 ? (
          <EmptyState title="No favorites yet." description="Shown once the customer saves a dish to their favorites." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {favorites.map((dish) => (
              <li key={dish.id}>
                <Badge>{dish.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl text-ivory">Reviews</h2>
        {reviews.length === 0 ? (
          <EmptyState title="No reviews yet." description="Shown once the customer leaves a review." />
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-ivory">
                    {review.rating}★ {review.dish_name ? `· ${review.dish_name}` : "· Restaurant"}
                  </span>
                  <Badge tone={review.status === "published" ? "default" : "outline"}>{review.status}</Badge>
                </div>
                {review.title ? <p className="mt-2 text-sm text-ivory">{review.title}</p> : null}
                {review.body ? <p className="mt-1 text-sm text-mute">{review.body}</p> : null}
                <p className="mt-2 text-xs text-mute">{formatDate(review.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
