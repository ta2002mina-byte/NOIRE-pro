import type { Metadata } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { Badge } from "@/components/ui/badge";
import { getRestaurant } from "@/lib/data/restaurant";
import { getPublishedChefNotes } from "@/lib/data/chef";

export const metadata: Metadata = {
  title: "Chef’s Desk",
  description: "Notes, stories and seasonal thinking from the NOIRÉ kitchen.",
  alternates: { canonical: "/chef" },
};

export default async function ChefPage() {
  const restaurant = await getRestaurant();
  const notes = restaurant ? await getPublishedChefNotes(restaurant.id) : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <SectionHeading
        level={1}
        kicker="Chef’s Desk"
        title="Notes from the kitchen"
        description="Seasonal thinking, ingredient stories and the ideas behind the menu."
      />

      {notes.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="The chef is writing."
          description="Notes from the kitchen will appear here once published."
        />
      ) : (
        <div className="mt-14 space-y-16">
          {notes.map((note) => (
            <article key={note.id} className="grid gap-8 border-t border-line pt-12 first:border-t-0 first:pt-0 sm:grid-cols-2 sm:items-start">
              <Media src={note.image_url} alt={note.title} ratio="aspect-[4/3]" />
              <div>
                <div className="flex flex-wrap gap-2">
                  {note.is_featured ? <Badge tone="claret">Featured</Badge> : null}
                  {note.ingredient ? <Badge tone="outline">{note.ingredient.name}</Badge> : null}
                </div>
                <h2 className="mt-4 text-2xl text-ivory sm:text-3xl">{note.title}</h2>
                <p className="mt-4 whitespace-pre-line text-mute">{note.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
