import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperienceForm } from "@/components/admin/experience-form";
import { requireAccess } from "@/lib/auth/session";
import { updateExperienceAction } from "@/lib/actions/experiences";
import { countUpcomingReservationsForExperience, getExperienceById } from "@/lib/data/experiences";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit experience" };

export default async function EditExperiencePage({ params }: PageProps) {
  await requireAccess("/admin/experiences");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const experience = restaurant ? await getExperienceById(restaurant.id, id) : null;
  if (!experience) notFound();

  const upcomingCount = await countUpcomingReservationsForExperience(experience.id);
  const updateThisExperience = updateExperienceAction.bind(null, experience.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Edit experience</h1>
        {upcomingCount > 0 ? (
          <p className="mt-2 text-sm text-mute">
            {upcomingCount} upcoming {upcomingCount === 1 ? "reservation is" : "reservations are"} tied to this
            experience. Deactivating keeps those bookings; deleting only removes the experience label from them.
          </p>
        ) : null}
      </div>
      <ExperienceForm experience={experience} action={updateThisExperience} />
    </div>
  );
}
