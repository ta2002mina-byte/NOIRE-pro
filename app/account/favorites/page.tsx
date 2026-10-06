import type { Metadata } from "next";
import Link from "next/link";

import { FavoriteCard } from "@/components/account/favorite-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getCustomerFavorites } from "@/lib/data/favorites";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Favorites" };

export default async function Page() {
  const ctx = await requireAccess("/account/favorites");

  const [favorites, restaurant] = await Promise.all([getCustomerFavorites(ctx.user.id), getRestaurant()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ivory">Favorites</h1>
        <p className="mt-1 text-sm text-mute">Dishes you&rsquo;ve saved from the menu.</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Save a dish from the menu to find it here next time you're planning a visit."
        >
          <Link href="/menu" className={buttonStyles({ variant: "primary" })}>
            Browse the menu
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {favorites.map((favorite) => (
            <FavoriteCard key={favorite.id} favorite={favorite} currency={restaurant?.currency} />
          ))}
        </ul>
      )}
    </div>
  );
}
