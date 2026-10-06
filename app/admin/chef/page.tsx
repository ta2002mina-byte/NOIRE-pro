import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ChefNoteCard } from "@/components/admin/chef-note-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getAllChefNotes } from "@/lib/data/chef";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Chef’s Desk" };

export default async function AdminChefPage() {
  await requireAccess("/admin/chef");
  const restaurant = await getRestaurant();
  const notes = restaurant ? await getAllChefNotes(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Chef’s Desk</h1>
          <p className="mt-2 max-w-prose text-mute">
            Write, schedule and publish notes from the kitchen. Published and due-scheduled notes appear on{" "}
            <Link href="/chef" className="underline hover:text-ivory">
              /chef
            </Link>
            .
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/chef/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New note
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState
          title="No restaurant record yet."
          description="Chef notes are attached to a restaurant. Create the restaurant record first."
        />
      ) : notes.length === 0 ? (
        <EmptyState title="No chef notes yet." description="Write the first one — it can stay a draft until you're ready.">
          <Link href="/admin/chef/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New note
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {notes.map((note) => (
            <ChefNoteCard key={note.id} note={note} />
          ))}
        </ul>
      )}
    </div>
  );
}
