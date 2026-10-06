import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import type { ChefNote } from "@/lib/data/chef";

export function ChefsDeskSection({ note }: { note: ChefNote | null }) {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker="Chef’s Desk" title="From the chef" link={{ href: "/chef", label: "Visit the Chef’s Desk" }} />

        {note ? (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:items-center">
            <Media src={note.image_url} alt={note.title} ratio="aspect-[4/3]" />
            <div>
              <p className="text-2xl text-ivory">{note.title}</p>
              <p className="mt-3 line-clamp-4 text-mute">{note.body}</p>
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="The chef is writing."
            description="Notes from the kitchen will appear here once published."
          />
        )}
      </div>
    </section>
  );
}
