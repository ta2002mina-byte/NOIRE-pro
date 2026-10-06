import type { Metadata } from "next";

import { JournalAddEntry } from "@/components/account/journal-add-entry";
import { JournalList } from "@/components/account/journal-list";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getCustomerJournalEntries, getDishOptions } from "@/lib/data/journal";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Dining journal" };

export default async function Page() {
  const ctx = await requireAccess("/account/journal");
  const restaurant = await getRestaurant();

  const [entries, dishOptions] = await Promise.all([
    getCustomerJournalEntries(ctx.user.id),
    restaurant ? getDishOptions(restaurant.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-ivory">Dining journal</h1>
        <p className="mt-1 text-sm text-mute">
          A private record of the dishes you&rsquo;ve tried, with your own notes and ratings. Only you can read it.
        </p>
      </div>

      <JournalAddEntry dishOptions={dishOptions} />

      {entries.length === 0 ? (
        <EmptyState
          title="Your journal is empty"
          description="Add your first entry above after your next visit — the dish, a date, and whatever you’d want to remember."
        />
      ) : (
        <JournalList entries={entries} dishOptions={dishOptions} />
      )}
    </div>
  );
}
