import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MenuItemForm } from "@/components/admin/menu-item-form";
import { MenuItemIngredientsForm } from "@/components/admin/menu-item-ingredients-form";
import { DishPreferenceForm } from "@/components/admin/dish-preference-form";
import { requireAccess } from "@/lib/auth/session";
import { updateMenuItemAction } from "@/lib/actions/menu";
import { getAllCategories, getLinkedIngredientIds, getMenuItemByIdForAdmin } from "@/lib/data/menu";
import { getIngredientOptions } from "@/lib/data/ingredients";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit dish" };

export default async function EditMenuItemPage({ params }: PageProps) {
  await requireAccess("/admin/menu");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const item = restaurant ? await getMenuItemByIdForAdmin(restaurant.id, id) : null;
  if (!item) notFound();

  const [categories, allIngredients, linkedIds] = await Promise.all([
    getAllCategories(restaurant!.id),
    getIngredientOptions(restaurant!.id),
    getLinkedIngredientIds(item.id),
  ]);

  const updateThisItem = updateMenuItemAction.bind(null, item.id);

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl">Edit dish</h1>
        <MenuItemForm item={item} categories={categories} action={updateThisItem} />
      </div>

      <section className="space-y-4 border-t border-line pt-8">
        <div>
          <h2 className="text-xl text-ivory">Ingredients used</h2>
          <p className="mt-1 text-sm text-mute">Shown on the dish page and used for &ldquo;Featured in&rdquo; on /our-ingredients.</p>
        </div>
        <MenuItemIngredientsForm menuItemId={item.id} allIngredients={allIngredients} linkedIds={linkedIds} />
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <div>
          <h2 className="text-xl text-ivory">Recommendation attributes</h2>
          <p className="mt-1 text-sm text-mute">Drives the mood-based menu filter and Find My Dish results.</p>
        </div>
        <DishPreferenceForm menuItemId={item.id} preference={item.dish_preferences[0] ?? null} />
      </section>
    </div>
  );
}
