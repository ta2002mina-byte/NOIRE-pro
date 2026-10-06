import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { ChefNoteStatusActions } from "@/components/admin/chef-note-status-actions";
import { DeleteChefNoteButton } from "@/components/admin/delete-chef-note-button";
import { CHEF_NOTE_STATUS_LABELS } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/utils/format";
import type { ChefNote } from "@/lib/data/chef";

const STATUS_TONE: Record<string, "default" | "claret" | "outline"> = {
  draft: "outline",
  scheduled: "default",
  published: "claret",
  archived: "outline",
};

export function ChefNoteCard({ note }: { note: ChefNote }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-raised sm:flex-row">
      <Media src={note.image_url} alt={note.title} ratio="aspect-[3/2]" className="w-full sm:w-56 sm:shrink-0" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-ivory">{note.title}</p>
            {note.ingredient ? <p className="text-sm text-mute">Related to {note.ingredient.name}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {note.is_featured ? <Badge tone="claret">Featured</Badge> : null}
            <Badge tone={STATUS_TONE[note.status] ?? "outline"}>{CHEF_NOTE_STATUS_LABELS[note.status] ?? note.status}</Badge>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-mute">{note.body}</p>

        {note.status === "scheduled" && note.publish_at ? (
          <p className="text-xs text-mute">Goes live {formatDateTime(note.publish_at)}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-2">
          <Link href={`/admin/chef/${note.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
          <ChefNoteStatusActions id={note.id} status={note.status} />
          <DeleteChefNoteButton id={note.id} title={note.title} />
        </div>
      </div>
    </li>
  );
}
