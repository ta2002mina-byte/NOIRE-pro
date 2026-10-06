import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import type { IngredientWithSourcing } from "@/lib/data/ingredients";

export function SourceToPlateSection({ ingredients }: { ingredients: IngredientWithSourcing[] }) {
  const preview = ingredients.slice(0, 4);

  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          kicker="Source → Plate"
          title="From the source to your plate"
          description="Where our ingredients come from, in the kitchen's own words."
          link={{ href: "/our-ingredients", label: "See every ingredient" }}
        />

        {preview.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {preview.map((ingredient) => (
              <div key={ingredient.id}>
                <Media src={ingredient.image_url} alt={ingredient.name} ratio="aspect-square" />
                <p className="mt-3 text-sm text-ivory">{ingredient.name}</p>
                {ingredient.ingredient_sources[0]?.source_name ? (
                  <p className="text-xs text-mute">{ingredient.ingredient_sources[0].source_name}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="Sourcing details are coming."
            description="We only publish ingredient and sourcing facts the kitchen has entered — nothing invented."
          />
        )}
      </div>
    </section>
  );
}
