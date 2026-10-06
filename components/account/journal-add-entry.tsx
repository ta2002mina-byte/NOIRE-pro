import { JournalEntryForm } from "@/components/account/journal-entry-form";
import { createJournalEntryAction } from "@/lib/actions/journal";
import type { DishOption } from "@/lib/data/journal";

export function JournalAddEntry({ dishOptions }: { dishOptions: DishOption[] }) {
  return (
    <div className="rounded-2xl border border-line bg-raised p-5 sm:p-6">
      <h2 className="font-display text-xl text-ivory">Add an entry</h2>
      <p className="mt-1 text-sm text-mute">A dish, a date, and whatever you want to remember about it.</p>
      <div className="mt-5">
        <JournalEntryForm
          action={createJournalEntryAction}
          dishOptions={dishOptions}
          submitLabel="Add entry"
          pendingLabel="Saving…"
        />
      </div>
    </div>
  );
}
