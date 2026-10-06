import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { QuickActionButton } from "@/components/admin/quick-action-button";
import { deleteStoryAction, publishStoryNowAction, unpublishStoryAction } from "@/lib/actions/stories";
import { STORY_TYPE_LABELS } from "@/lib/constants/labels";
import { isStoryLive } from "@/lib/data/visibility";
import type { RestaurantStory } from "@/lib/data/stories";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function StoryCard({ story }: { story: RestaurantStory }) {
  const live = isStoryLive(story);
  const publishedLabel = formatDate(story.published_at);
  const expiresLabel = formatDate(story.expires_at);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-raised sm:flex-row">
      <Media src={story.media_url} alt={story.title} ratio="aspect-[3/2]" className="w-full sm:w-56 sm:shrink-0" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-ivory">{story.title}</p>
            <p className="text-sm text-mute">{STORY_TYPE_LABELS[story.story_type] ?? story.story_type}</p>
          </div>
          <Badge tone={live ? "default" : "outline"}>{live ? "Live now" : story.is_active ? "Scheduled/Inactive" : "Inactive"}</Badge>
        </div>

        {story.description ? <p className="line-clamp-2 text-sm text-mute">{story.description}</p> : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
          <span>{publishedLabel ? `Publishes ${publishedLabel}` : "Not scheduled"}</span>
          {expiresLabel ? <span>Expires {expiresLabel}</span> : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-2">
          <Link href={`/admin/stories/${story.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
          {story.is_active ? (
            <QuickActionButton label="Unpublish" action={() => unpublishStoryAction(story.id)} />
          ) : (
            <QuickActionButton label="Publish now" action={() => publishStoryNowAction(story.id)} />
          )}
          <ConfirmActionButton
            label="Delete"
            confirmMessage={`Delete “${story.title}”?`}
            confirmLabel="Yes, delete"
            action={() => deleteStoryAction(story.id)}
          />
        </div>
      </div>
    </li>
  );
}
