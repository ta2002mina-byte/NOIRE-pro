import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoryForm } from "@/components/admin/story-form";
import { requireAccess } from "@/lib/auth/session";
import { updateStoryAction } from "@/lib/actions/stories";
import { getStoryById } from "@/lib/data/stories";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit story" };

export default async function EditStoryPage({ params }: PageProps) {
  await requireAccess("/admin/stories");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const story = restaurant ? await getStoryById(restaurant.id, id) : null;
  if (!story) notFound();

  const updateThisStory = updateStoryAction.bind(null, story.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Edit story</h1>
      <StoryForm story={story} action={updateThisStory} />
    </div>
  );
}
