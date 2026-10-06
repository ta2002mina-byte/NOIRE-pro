import { JournalEntryCard } from "@/components/account/journal-entry-card";
import type { DishOption, JournalEntry } from "@/lib/data/journal";

export function JournalList({ entries, dishOptions }: { entries: JournalEntry[]; dishOptions: DishOption[] }) {
  return (
    <ul className="space-y-4">
      {entries.map((entry) => (
        <JournalEntryCard key={entry.id} entry={entry} dishOptions={dishOptions} />
      ))}
    </ul>
  );
}
