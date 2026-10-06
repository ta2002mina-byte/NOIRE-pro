import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { IngredientCard } from "@/components/admin/ingredient-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getAllIngredientsForAdmin } from "@/lib/data/ingredients";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Ingredients" };

export default async function AdminIngredientsPage() {
  await requireAccess("/admin/ingredients");
  const restaurant = await getRestaurant();
  const ingredients = restaurant ? await getAllIngredientsForAdmin(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Ingredients</h1>
          <p className="mt-2 max-w-prose text-mute">
            Ingredients, their sourcing and the dishes that use them. Only facts entered here — and only
            published sources — appear on{" "}
            <Link href="/our-ingredients" className="underline hover:text-ivory">
              /our-ingredients
            </Link>
            .
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/ingredients/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New ingredient
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState
          title="No restaurant record yet."
          description="Ingredients are attached to a restaurant. Create the restaurant record first."
        />
      ) : ingredients.length === 0 ? (
        <EmptyState title="No ingredients yet." description="Add the first one, then attach its sourcing and dishes.">
          <Link href="/admin/ingredients/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New ingredient
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {ingredients.map((ingredient) => (
            <IngredientCard key={ingredient.id} ingredient={ingredient} />
          ))}
        </ul>
      )}
    </div>
  );
}
