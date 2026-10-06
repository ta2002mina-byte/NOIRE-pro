import type { Metadata } from "next";

import { ChefNoteForm } from "@/components/admin/chef-note-form";
import { requireAccess } from "@/lib/auth/session";
import { createChefNoteAction } from "@/lib/actions/chef";
import { getIngredientOptions } from "@/lib/data/ingredients";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "New chef note" };

export default async function NewChefNotePage() {
  await requireAccess("/admin/chef");
  const restaurant = await getRestaurant();
  const ingredientOptions = restaurant ? await getIngredientOptions(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">New chef note</h1>
      <ChefNoteForm action={createChefNoteAction} ingredientOptions={ingredientOptions} />
    </div>
  );
}
