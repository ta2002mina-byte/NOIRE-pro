import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import type { DiningExperience } from "@/lib/data/experiences";

export function ExperiencesSection({ experiences }: { experiences: DiningExperience[] }) {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker="Tailored to you" title="Choose Your Experience" />

        {experiences.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => (
              <Link
                key={experience.id}
                href={`/reserve?experience=${experience.slug}`}
                className="group block"
              >
                <Media src={experience.image_url} alt={experience.title} ratio="aspect-[3/2]" />
                <p className="mt-4 text-lg text-ivory">{experience.title}</p>
                {experience.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-mute">{experience.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="Experiences are being curated."
            description="Casual dinners, celebrations and the Chef’s table will appear here soon."
          />
        )}
      </div>
    </section>
  );
}
