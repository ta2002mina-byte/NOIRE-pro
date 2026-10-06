import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { DishCard } from "@/components/menu/dish-card";
import type { MenuItemWithExtras } from "@/lib/data/menu";

export function FeaturedDishesSection({ dishes, currency }: { dishes: MenuItemWithExtras[]; currency: string }) {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          kicker="Featured"
          title="Featured dishes"
          link={{ href: "/menu", label: "View the full menu" }}
        />

        {dishes.length > 0 ? (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} currency={currency} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="The menu is being set."
            description="Featured dishes will appear here once the kitchen publishes them."
          />
        )}
      </div>
    </section>
  );
}
