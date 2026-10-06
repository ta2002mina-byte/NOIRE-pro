import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";

export function MoodSection() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker="Discover your mood" title="What are you in the mood for?" />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MOOD_FILTERS.map((mood) => (
            <Link
              key={mood.slug}
              href={`/menu?mood=${mood.slug}`}
              className="flex min-h-28 items-center justify-center rounded-2xl border border-line px-4 py-6 text-center text-sm text-ivory transition-colors hover:border-claret hover:bg-raised"
            >
              {mood.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
