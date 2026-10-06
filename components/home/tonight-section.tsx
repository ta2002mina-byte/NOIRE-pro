import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { buttonStyles } from "@/components/ui/button";
import { formatDateLong } from "@/lib/utils/format";
import type { Restaurant } from "@/lib/data/restaurant";
import type { RestaurantStory } from "@/lib/data/stories";
import { STORY_TYPE_LABELS, labelFor } from "@/lib/constants/labels";

export function TonightSection({
  restaurant,
  stories,
}: {
  restaurant: Restaurant | null;
  stories: RestaurantStory[];
}) {
  const today = formatDateLong(new Date(), restaurant?.timezone);
  const preview = stories.slice(0, 2);

  return (
    <section id="tonight" className="scroll-mt-20 border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker={today} title="Tonight at NOIRÉ" />

        {preview.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {preview.map((story) => (
              <Link
                key={story.id}
                href="/stories"
                className="rounded-2xl border border-line p-6 transition-colors hover:border-ivory/40"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-blush">{labelFor(STORY_TYPE_LABELS, story.story_type)}</p>
                <p className="mt-3 text-xl text-ivory">{story.title}</p>
                {story.description ? <p className="mt-2 text-sm text-mute">{story.description}</p> : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-8 sm:p-10">
            <p className="max-w-prose text-mute">
              The dining room is ready. Reserve a table and make tonight yours.
            </p>
            <Link href="/reserve" className={buttonStyles({ variant: "outline", className: "mt-6" })}>
              Reserve a table
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
