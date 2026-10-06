import type { Metadata } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { getRestaurant } from "@/lib/data/restaurant";
import { getIngredientsWithSourcing } from "@/lib/data/ingredients";
import { SOURCE_TYPE_LABELS, labelFor } from "@/lib/constants/labels";
import { formatDateOnly } from "@/lib/utils/format";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const metadata: Metadata = {
  title: "Our Ingredients",
  description: "Source → Plate — where NOIRÉ's ingredients come from.",
  alternates: { canonical: "/our-ingredients" },
};

export default async function OurIngredientsPage() {
  const restaurant = await getRestaurant();
  const ingredients = restaurant ? await getIngredientsWithSourcing(restaurant.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <SectionHeading
        level={1}
        kicker="Source → Plate"
        title="Our ingredients"
        description="Factual, kitchen-entered sourcing information — nothing invented."
      />

      {ingredients.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Sourcing details are coming."
          description="We only publish sourcing facts the kitchen has entered."
        />
      ) : (
        <div className="mt-14 space-y-16">
          {ingredients.map((ingredient) => (
            <article
              key={ingredient.id}
              className="grid gap-8 border-t border-line pt-12 first:border-t-0 first:pt-0 sm:grid-cols-[1fr_2fr]"
            >
              <Media src={ingredient.image_url} alt={ingredient.name} ratio="aspect-square" />
              <div>
                <h2 className="text-2xl text-ivory">{ingredient.name}</h2>
                {ingredient.season ? <p className="mt-1 text-sm text-mute">Season: {ingredient.season}</p> : null}
                {ingredient.description ? <p className="mt-3 text-mute">{ingredient.description}</p> : null}

                {ingredient.ingredient_sources.length > 0 ? (
                  <dl className="mt-6 space-y-4">
                    {ingredient.ingredient_sources.map((source) => (
                      <div key={source.id} className="rounded-xl border border-line p-4">
                        <dt className="text-ivory">{source.source_name}</dt>
                        <dd className="mt-1 space-y-1 text-sm text-mute">
                          {source.source_type ? <p>{labelFor(SOURCE_TYPE_LABELS, source.source_type)}</p> : null}
                          {source.location ? <p>{source.location}</p> : null}
                          {source.season_start_month && source.season_end_month ? (
                            <p>
                              In season {MONTHS[source.season_start_month - 1]} – {MONTHS[source.season_end_month - 1]}
                            </p>
                          ) : null}
                          {source.harvest_date ? <p>Harvested {formatDateOnly(source.harvest_date)}</p> : null}
                          {source.notes ? <p>{source.notes}</p> : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-6 text-sm text-mute">Sourcing details for this ingredient aren&rsquo;t published yet.</p>
                )}

                {ingredient.dishes.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-mute">Featured in</p>
                    <p className="mt-2 text-sm text-ivory">{ingredient.dishes.map((d) => d.name).join(", ")}</p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
