import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IngredientForm } from "@/components/admin/ingredient-form";
import { IngredientSourcesPanel } from "@/components/admin/ingredient-sources-panel";
import { IngredientDishLinksForm } from "@/components/admin/ingredient-dish-links-form";
import { requireAccess } from "@/lib/auth/session";
import { updateIngredientAction } from "@/lib/actions/ingredients";
import { getIngredientByIdForAdmin, getLinkedMenuItemIds } from "@/lib/data/ingredients";
import { getMenuItemOptions } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit ingredient" };

export default async function EditIngredientPage({ params }: PageProps) {
  await requireAccess("/admin/ingredients");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const ingredient = restaurant ? await getIngredientByIdForAdmin(restaurant.id, id) : null;
  if (!ingredient) notFound();

  const [allDishes, linkedIds] = await Promise.all([
    restaurant ? getMenuItemOptions(restaurant.id) : Promise.resolve([]),
    getLinkedMenuItemIds(ingredient.id),
  ]);

  const updateThisIngredient = updateIngredientAction.bind(null, ingredient.id);

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl">Edit ingredient</h1>
        <IngredientForm ingredient={ingredient} action={updateThisIngredient} />
      </div>

      <section className="space-y-4 border-t border-line pt-8">
        <div>
          <h2 className="text-xl text-ivory">Sourcing</h2>
          <p className="mt-1 text-sm text-mute">
            Only published sources appear on /our-ingredients. Everything here must be a fact the kitchen
            has entered — never invent a supplier, farm, or harvest date.
          </p>
        </div>
        <IngredientSourcesPanel ingredientId={ingredient.id} sources={ingredient.ingredient_sources} />
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <div>
          <h2 className="text-xl text-ivory">Used in dishes</h2>
          <p className="mt-1 text-sm text-mute">Shown under &ldquo;Featured in&rdquo; on /our-ingredients.</p>
        </div>
        <IngredientDishLinksForm ingredientId={ingredient.id} allDishes={allDishes} linkedIds={linkedIds} />
      </section>
    </div>
  );
}
