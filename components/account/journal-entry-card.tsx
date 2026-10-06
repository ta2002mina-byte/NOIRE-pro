"use client";

import * as React from "react";

import { Media } from "@/components/ui/media";
import { DeleteJournalEntryButton } from "@/components/account/delete-journal-entry-button";
import { JournalEntryForm } from "@/components/account/journal-entry-form";
import { Button } from "@/components/ui/button";
import { updateJournalEntryAction } from "@/lib/actions/journal";
import type { DishOption, JournalEntry } from "@/lib/data/journal";
import { formatDateOnly } from "@/lib/utils/format";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`Rated ${rating} out of 5`} className="text-sm tracking-wide text-claret">
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function JournalEntryCard({ entry, dishOptions }: { entry: JournalEntry; dishOptions: DishOption[] }) {
  const [editing, setEditing] = React.useState(false);
  const updateThisEntry = updateJournalEntryAction.bind(null, entry.id);

  if (editing) {
    return (
      <li className="rounded-2xl border border-line bg-raised p-5">
        <JournalEntryForm
          action={updateThisEntry}
          dishOptions={dishOptions}
          entry={entry}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          onCancel={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex gap-4 rounded-2xl border border-line bg-raised p-5">
      <Media
        src={entry.menu_item?.image_url}
        alt={entry.menu_item?.name ?? ""}
        ratio="aspect-square"
        className="w-20 shrink-0 sm:w-24"
        sizes="96px"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-ivory">{entry.menu_item?.name ?? "A dish at NOIRÉ"}</p>
            <p className="mt-1 text-sm text-mute">{formatDateOnly(entry.visited_at)}</p>
          </div>
          {entry.rating ? <Stars rating={entry.rating} /> : null}
        </div>

        {entry.personal_note ? <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm text-ivory">{entry.personal_note}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <DeleteJournalEntryButton entryId={entry.id} />
        </div>
      </div>
    </li>
  );
}
