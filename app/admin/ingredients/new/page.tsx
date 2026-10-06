import type { Metadata } from "next";

import { IngredientForm } from "@/components/admin/ingredient-form";
import { requireAccess } from "@/lib/auth/session";
import { createIngredientAction } from "@/lib/actions/ingredients";

export const metadata: Metadata = { title: "New ingredient" };

export default async function NewIngredientPage() {
  await requireAccess("/admin/ingredients");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">New ingredient</h1>
      <IngredientForm action={createIngredientAction} />
    </div>
  );
}
