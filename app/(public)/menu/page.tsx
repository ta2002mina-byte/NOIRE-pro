import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { DishCard } from "@/components/menu/dish-card";
import { MenuFilters } from "@/components/menu/menu-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getMoodBySlug, isDietFilterValue, isSortValue, parseMaxSpice } from "@/lib/constants/menu-filters";
import { getCategories, getMenuItems, type MenuItemFilters } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";

interface MenuSearchParams {
  mood?: string;
  q?: string;
  diet?: string;
  spice?: string;
  sort?: string;
}

interface PageProps {
  searchParams: Promise<MenuSearchParams>;
}

function parseFilters(params: MenuSearchParams): { filters: MenuItemFilters; moodLabel?: string } {
  const mood = getMoodBySlug(params.mood);
  const diet = isDietFilterValue(params.diet) ? params.diet : undefined;
  const maxSpice = parseMaxSpice(params.spice);
  const sort = isSortValue(params.sort) ? params.sort : undefined;
  const search = params.q?.trim() || undefined;

  return {
    filters: { mood: mood?.value, diet, maxSpice, sort, search },
    moodLabel: mood?.label,
  };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const { moodLabel } = parseFilters(params);

  return {
    title: moodLabel ? `${moodLabel} — Menu` : "Menu",
    description: moodLabel
      ? `The NOIRÉ menu — dishes for when you are in the mood for ${moodLabel.toLowerCase()}.`
      : "The full NOIRÉ menu — filter by mood, diet or spice to find your dish.",
    alternates: { canonical: "/menu" },
  };
}

export default async function MenuPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const restaurant = await getRestaurant();

  if (!restaurant) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28">
        <SectionHeading level={1} kicker="Menu" title="The menu" />
        <EmptyState
          className="mt-10"
          title="The menu is being prepared."
          description="Dishes will appear here once the kitchen publishes them."
        />
      </div>
    );
  }

  const { filters, moodLabel } = parseFilters(params);
  const hasActiveFilters = Boolean(
    filters.mood || filters.diet || typeof filters.maxSpice === "number" || filters.sort || filters.search,
  );

  const [categories, items] = await Promise.all([
    getCategories(restaurant.id),
    getMenuItems(restaurant.id, filters),
  ]);

  const activeCategoryIds = new Set(categories.map((category) => category.id));
  const uncategorized = items.filter((item) => !item.category_id || !activeCategoryIds.has(item.category_id));
  const groups = categories
    .map((category) => ({ category, items: items.filter((item) => item.category_id === category.id) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
      <SectionHeading
        level={1}
        kicker="Menu"
        title={moodLabel ?? "The menu"}
        description="Our dishes, organized by course. Anything not being served tonight is marked."
      />

      <div className="mt-10">
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <MenuFilters />
        </Suspense>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-10"
          title={hasActiveFilters ? "No dishes match your filters." : "The menu is being prepared."}
          description={
            hasActiveFilters
              ? "Try a different mood, diet, spice level, or search term."
              : "Dishes will appear here once the kitchen publishes them."
          }
        >
          {hasActiveFilters ? (
            <Link href="/menu" className={buttonStyles({ variant: "outline" })}>
              Clear filters
            </Link>
          ) : null}
        </EmptyState>
      ) : hasActiveFilters ? (
        <div className="mt-10">
          <p className="text-sm text-mute" role="status">
            {items.length} {items.length === 1 ? "dish" : "dishes"}
          </p>
          <div className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((dish) => (
              <DishCard key={dish.id} dish={dish} currency={restaurant.currency} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-14 space-y-16">
          {groups.map(({ category, items: categoryItems }) => (
            <section key={category.id} aria-labelledby={`category-${category.slug}`}>
              <h2 id={`category-${category.slug}`} className="text-2xl text-ivory">
                {category.name}
              </h2>
              {category.description ? <p className="mt-2 max-w-xl text-mute">{category.description}</p> : null}
              <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((dish) => (
                  <DishCard key={dish.id} dish={dish} currency={restaurant.currency} />
                ))}
              </div>
            </section>
          ))}

          {uncategorized.length > 0 ? (
            <section aria-labelledby="category-more">
              <h2 id="category-more" className="text-2xl text-ivory">
                More
              </h2>
              <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorized.map((dish) => (
                  <DishCard key={dish.id} dish={dish} currency={restaurant.currency} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}