import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import { TonightSection } from "@/components/home/tonight-section";
import { MoodSection } from "@/components/home/mood-section";
import { FindMyDishSection } from "@/components/home/find-my-dish-section";
import { FeaturedDishesSection } from "@/components/home/featured-dishes-section";
import { ExperiencesSection } from "@/components/home/experiences-section";
import { SourceToPlateSection } from "@/components/home/source-to-plate-section";
import { ChefsDeskSection } from "@/components/home/chefs-desk-section";
import { StoriesSection } from "@/components/home/stories-section";
import { SpacesSection } from "@/components/home/spaces-section";
import { ReserveCta } from "@/components/home/reserve-cta";
import { JournalPassportSection } from "@/components/home/journal-passport-section";
import { LocationHoursSection } from "@/components/home/location-hours-section";
import { getRestaurant } from "@/lib/data/restaurant";
import { getFeaturedDishes } from "@/lib/data/menu";
import { getActiveExperiences } from "@/lib/data/experiences";
import { getIngredientsWithSourcing } from "@/lib/data/ingredients";
import { getFeaturedChefNote } from "@/lib/data/chef";
import { getLiveStories } from "@/lib/data/stories";
import { getGalleryImages } from "@/lib/data/gallery";
import { getSiteContent } from "@/lib/data/site-content";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "NOIRÉ — Dinner, Reimagined",
  description: "Your table. Your taste. Your story.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const restaurant = await getRestaurant();
  const ctx = await getAuthContext();
  const siteContent = await getSiteContent();

  const [dishes, experiences, ingredients, chefNote, stories, gallery] = restaurant
    ? await Promise.all([
        getFeaturedDishes(restaurant.id),
        getActiveExperiences(restaurant.id),
        getIngredientsWithSourcing(restaurant.id),
        getFeaturedChefNote(restaurant.id),
        getLiveStories(restaurant.id),
        getGalleryImages(restaurant.id),
      ])
    : [[], [], [], null, [], []];

  const heroImage = siteContent?.hero_image_url || (gallery.find((g) => g.image_url)?.image_url ?? null);

  return (
    <>
      <Hero heroImageUrl={heroImage} content={siteContent} />
      <TonightSection restaurant={restaurant} stories={stories} />
      <MoodSection />
      <FindMyDishSection />
      <FeaturedDishesSection dishes={dishes} currency={restaurant?.currency ?? "USD"} />
      <ExperiencesSection experiences={experiences} />
      <SourceToPlateSection ingredients={ingredients} />
      <ChefsDeskSection note={chefNote} />
      <StoriesSection stories={stories} />
      <SpacesSection images={gallery} />
      <ReserveCta />
      <JournalPassportSection signedIn={Boolean(ctx)} />
      <LocationHoursSection restaurant={restaurant} />
    </>
  );
}
