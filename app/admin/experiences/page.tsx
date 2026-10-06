import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ExperienceCard } from "@/components/admin/experience-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getAllExperiences } from "@/lib/data/experiences";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Experiences" };

export default async function AdminExperiencesPage() {
  await requireAccess("/admin/experiences");
  const restaurant = await getRestaurant();
  const experiences = restaurant ? await getAllExperiences(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Experiences</h1>
          <p className="mt-2 max-w-prose text-mute">
            Create and edit the dining experiences guests can choose — Casual Dinner, Romantic Dinner, Chef’s
            Experience and the rest. Active experiences appear on the homepage and in the reservation flow.
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/experiences/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New experience
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState
          title="No restaurant record yet."
          description="Experiences are attached to a restaurant. Create the restaurant record first."
        />
      ) : experiences.length === 0 ? (
        <EmptyState
          title="No experiences yet."
          description="Add the first one — Casual Dinner, Romantic Dinner, Family Gathering, Birthday, Business Dinner or Chef’s Experience."
        >
          <Link href="/admin/experiences/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New experience
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </ul>
      )}
    </div>
  );
}
