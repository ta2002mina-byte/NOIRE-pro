import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { StoryCard } from "@/components/admin/story-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getAllStories } from "@/lib/data/stories";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Stories" };

export default async function AdminStoriesPage() {
  await requireAccess("/admin/stories");
  const restaurant = await getRestaurant();
  const stories = restaurant ? await getAllStories(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Stories</h1>
          <p className="mt-2 max-w-prose text-mute">
            Kitchen notes, chef stories, dish stories, ingredient stories, behind-the-scenes and events — the
            content that appears on /stories and feeds &ldquo;Tonight at NOIRÉ.&rdquo;
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/stories/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New story
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState title="No restaurant record yet." description="Stories are attached to a restaurant." />
      ) : stories.length === 0 ? (
        <EmptyState title="No stories yet." description="Add the first one — a kitchen note, an event, a dish story.">
          <Link href="/admin/stories/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New story
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </ul>
      )}
    </div>
  );
}
