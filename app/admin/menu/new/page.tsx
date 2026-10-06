import type { Metadata } from "next";

import { MenuItemForm } from "@/components/admin/menu-item-form";
import { requireAccess } from "@/lib/auth/session";
import { createMenuItemAction } from "@/lib/actions/menu";
import { getAllCategories } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "New dish" };

export default async function NewMenuItemPage() {
  await requireAccess("/admin/menu");
  const restaurant = await getRestaurant();
  const categories = restaurant ? await getAllCategories(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">New dish</h1>
      <MenuItemForm categories={categories} action={createMenuItemAction} />
    </div>
  );
}
