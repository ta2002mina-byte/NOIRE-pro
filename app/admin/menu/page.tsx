import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { MenuItemCard } from "@/components/admin/menu-item-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getAllMenuItemsForAdmin } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  await requireAccess("/admin/menu");
  const restaurant = await getRestaurant();
  const items = restaurant ? await getAllMenuItemsForAdmin(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Menu</h1>
          <p className="mt-2 max-w-prose text-mute">
            Every dish — story, chef&rsquo;s note, ingredients, nutrition, spice, dietary tags, availability,
            feature flags and the recommendation attributes that drive the mood menu and Find My Dish.
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/menu/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New dish
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState title="No restaurant record yet." description="Dishes are attached to a restaurant." />
      ) : items.length === 0 ? (
        <EmptyState title="No dishes yet." description="Add the first one to start building the menu.">
          <Link href="/admin/menu/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New dish
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
