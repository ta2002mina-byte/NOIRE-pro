import type { Metadata } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationWizard } from "@/components/reserve/reservation-wizard";
import { getAuthContext } from "@/lib/auth/session";
import { hasReservableTables } from "@/lib/data/reservation";
import { getRestaurant, parseOpeningHours } from "@/lib/data/restaurant";
import { getActiveExperiences } from "@/lib/data/experiences";

interface PageProps {
  searchParams: Promise<{ experience?: string }>;
}

export const metadata: Metadata = {
  title: "Reserve",
  description: "Reserve a table at NOIRÉ.",
  alternates: { canonical: "/reserve" },
};

export default async function ReservePage({ searchParams }: PageProps) {
  const { experience: experienceSlug } = await searchParams;
  const restaurant = await getRestaurant();

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <SectionHeading level={1} kicker="Reserve" title="Reserve a table" align="center" className="mx-auto" />
        <EmptyState
          className="mt-10"
          title="Online reservations are almost here."
          description="We’re finishing setup. Please check back shortly."
        />
      </div>
    );
  }

  const [experiences, auth, hasTables] = await Promise.all([
    getActiveExperiences(restaurant.id),
    getAuthContext(),
    hasReservableTables(restaurant.id),
  ]);
  const hours = parseOpeningHours(restaurant.opening_hours);
  const selected = experiences.find((e) => e.slug === experienceSlug) ?? null;

  if (!hasTables) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <SectionHeading level={1} kicker="Reserve" title="Reserve a table" align="center" className="mx-auto" />
        <EmptyState
          className="mt-10"
          title="Online reservations are almost here."
          description="Our visual table map is still being set up. In the meantime, reach us directly to book."
        >
          {restaurant.phone || restaurant.email ? (
            <div className="flex flex-col items-center gap-1 text-sm">
              {restaurant.phone ? (
                <a href={`tel:${restaurant.phone}`} className="text-ivory hover:underline">
                  {restaurant.phone}
                </a>
              ) : null}
              {restaurant.email ? (
                <a href={`mailto:${restaurant.email}`} className="text-mute hover:text-ivory">
                  {restaurant.email}
                </a>
              ) : null}
            </div>
          ) : null}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <SectionHeading
        level={1}
        kicker="Reserve"
        title="Reserve a table"
        description={
          selected
            ? `Booking the "${selected.title}" experience. Your table, your taste, your story.`
            : "A few quick steps to your table tonight."
        }
        align="center"
        className="mx-auto"
      />

      <div className="mt-12">
        <ReservationWizard
          experiences={experiences}
          hours={hours}
          initialExperienceId={selected?.id ?? null}
          isSignedIn={Boolean(auth)}
        />
      </div>
    </div>
  );
}
