import type { Metadata } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { getRestaurant, formatLocationLine } from "@/lib/data/restaurant";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind NOIRÉ.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const restaurant = await getRestaurant();
  const location = restaurant ? formatLocationLine(restaurant) : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <SectionHeading level={1} kicker="About" title={restaurant?.name ?? "About NOIRÉ"} />

      {restaurant?.tagline ? <p className="mt-6 text-xl text-ivory">{restaurant.tagline}</p> : null}

      {restaurant?.description ? (
        <p className="mt-6 whitespace-pre-line text-mute">{restaurant.description}</p>
      ) : (
        <EmptyState
          className="mt-10"
          title="Our story is being written."
          description="A description of NOIRÉ — its philosophy, space and people — will appear here once published."
        />
      )}

      {location ? <p className="mt-10 text-sm text-mute">{location}</p> : null}
    </div>
  );
}
