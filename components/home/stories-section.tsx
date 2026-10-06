import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import type { RestaurantStory } from "@/lib/data/stories";
import { STORY_TYPE_LABELS, labelFor } from "@/lib/constants/labels";

export function StoriesSection({ stories }: { stories: RestaurantStory[] }) {
  const preview = stories.slice(0, 3);

  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker="Live now" title="Tonight’s stories" link={{ href: "/stories", label: "See all stories" }} />

        {preview.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {preview.map((story) => (
              <div key={story.id}>
                <Media src={story.media_url} alt={story.title} ratio="aspect-[3/4]" />
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-blush">{labelFor(STORY_TYPE_LABELS, story.story_type)}</p>
                <p className="mt-1 text-lg text-ivory">{story.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="No stories are live right now."
            description="Kitchen moments, chef notes and behind-the-scenes updates appear here as they go live."
          />
        )}
      </div>
    </section>
  );
}
