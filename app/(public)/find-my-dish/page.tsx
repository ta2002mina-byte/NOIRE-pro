import type { Metadata } from "next";

import { FindMyDishQuiz } from "@/components/find-my-dish/quiz";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAuthContext } from "@/lib/auth/session";
import { getMenuItems } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";
import { extractDishFacets } from "@/lib/recommendations/find-my-dish";

export const metadata: Metadata = {
  title: "Find My Dish",
  description: "A short quiz that matches your mood, hunger and taste to a dish on the NOIRÉ menu.",
  alternates: { canonical: "/find-my-dish" },
};

export default async function FindMyDishPage() {
  const restaurant = await getRestaurant();

  if (!restaurant) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
        <SectionHeading level={1} kicker="Find My Dish" title="Find my dish" align="center" />
        <EmptyState
          className="mt-10"
          title="The menu is being prepared."
          description="Find My Dish will be ready once the kitchen publishes tonight's dishes."
        />
      </div>
    );
  }

  const [items, auth] = await Promise.all([getMenuItems(restaurant.id), getAuthContext()]);
  const facets = extractDishFacets(items);
  const hasAvailableDishes = items.some((item) => item.is_available);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      <SectionHeading
        level={1}
        kicker="Find My Dish"
        title="What should you have tonight?"
        description="A short, personal quiz — not a scientific test — matched against what's actually on the menu."
        align="center"
      />

      <div className="mt-14">
        {hasAvailableDishes ? (
          <FindMyDishQuiz facets={facets} isAuthenticated={Boolean(auth)} currency={restaurant.currency} />
        ) : (
          <EmptyState
            title="Nothing is available for the quiz right now."
            description="Check back soon, or explore the full menu for what's coming up."
          />
        )}
      </div>
    </div>
  );
}
