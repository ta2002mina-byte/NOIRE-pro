import type { Metadata } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Badge } from "@/components/ui/badge";
import { getRestaurant } from "@/lib/data/restaurant";
import { getLiveStories } from "@/lib/data/stories";
import { STORY_TYPE_LABELS, labelFor } from "@/lib/constants/labels";

export const metadata: Metadata = {
  title: "Stories",
  description: "Tonight’s stories from the NOIRÉ kitchen and dining room.",
  alternates: { canonical: "/stories" },
};

export default async function StoriesPage() {
  const restaurant = await getRestaurant();
  const stories = restaurant ? await getLiveStories(restaurant.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <SectionHeading level={1} kicker="Live now" title="Tonight’s stories" description="Kitchen moments, chef stories and behind-the-scenes updates." />

      {stories.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No stories are live right now."
          description="Check back soon — kitchen and dining-room stories appear here as they go live."
        />
      ) : (
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <article key={story.id}>
              <Media src={story.media_url} alt={story.title} ratio="aspect-[3/4]" />
              <Badge tone="outline" className="mt-4">
                {labelFor(STORY_TYPE_LABELS, story.story_type)}
              </Badge>
              <h2 className="mt-2 text-xl text-ivory">{story.title}</h2>
              {story.description ? <p className="mt-2 text-sm text-mute">{story.description}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
