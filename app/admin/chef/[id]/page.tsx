import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChefNoteForm } from "@/components/admin/chef-note-form";
import { requireAccess } from "@/lib/auth/session";
import { updateChefNoteAction } from "@/lib/actions/chef";
import { getChefNoteById } from "@/lib/data/chef";
import { getIngredientOptions } from "@/lib/data/ingredients";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit chef note" };

export default async function EditChefNotePage({ params }: PageProps) {
  await requireAccess("/admin/chef");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const note = restaurant ? await getChefNoteById(restaurant.id, id) : null;
  if (!note) notFound();

  const ingredientOptions = restaurant ? await getIngredientOptions(restaurant.id) : [];
  const updateThisNote = updateChefNoteAction.bind(null, note.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Edit chef note</h1>
      <ChefNoteForm note={note} action={updateThisNote} ingredientOptions={ingredientOptions} />
    </div>
  );
}
