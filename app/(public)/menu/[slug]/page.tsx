import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/ui/json-ld";
import { Media } from "@/components/ui/media";
import { SpiceLevel } from "@/components/menu/spice-level";
import { DishReviews } from "@/components/menu/dish-reviews";
import { FavoriteButton } from "@/components/menu/favorite-button";
import { buttonStyles } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth/session";
import { getRestaurant } from "@/lib/data/restaurant";
import { getMenuItemBySlug } from "@/lib/data/menu";
import { isMenuItemFavorited } from "@/lib/data/favorites";
import { getPublishedDishReviews } from "@/lib/data/reviews";
import { formatPrice } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant();
  const dish = restaurant ? await getMenuItemBySlug(restaurant.id, slug) : null;
  if (!dish) return { title: "Dish" };

  const description = dish.description ?? `${dish.name} — NOIRÉ`;
  return {
    title: dish.name,
    description,
    alternates: { canonical: `/menu/${dish.slug}` },
    openGraph: {
      title: dish.name,
      description,
      images: dish.image_url ? [{ url: dish.image_url }] : undefined,
    },
  };
}

export default async function DishPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getRestaurant();
  if (!restaurant) notFound();

  const dish = await getMenuItemBySlug(restaurant.id, slug);
  if (!dish) notFound();

  const auth = await getAuthContext();
  const [favorited, reviews] = await Promise.all([
    auth ? isMenuItemFavorited(auth.user.id, dish.id) : Promise.resolve(false),
    getPublishedDishReviews(dish.id),
  ]);

  // Only what the kitchen has linked to this dish; nothing is inferred from the description.
  const ingredients = dish.menu_item_ingredients.flatMap((link) =>
    link.ingredient?.is_active ? [link.ingredient] : [],
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      {/* name/description/image/price come straight from this dish's own record —
          nothing inferred (see the ingredients comment below for the same rule). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MenuItem",
          name: dish.name,
          description: dish.description ?? undefined,
          image: dish.image_url ?? undefined,
          offers: { "@type": "Offer", price: dish.price, priceCurrency: restaurant.currency },
        }}
      />

      <Link href="/menu" className="inline-flex items-center gap-2 text-sm text-mute hover:text-ivory">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to menu
      </Link>

      <div className="mt-8 grid gap-10 sm:grid-cols-2 sm:items-start">
        <Media
          src={dish.image_url}
          alt={dish.name}
          ratio="aspect-[4/5]"
          priority
          sizes="(min-width: 640px) 50vw, 100vw"
        />

        <div>
          <div className="flex flex-wrap gap-2">
            {dish.is_chef_choice ? <Badge tone="claret">Chef&rsquo;s Choice</Badge> : null}
            {dish.is_featured ? <Badge tone="outline">Featured</Badge> : null}
            {!dish.is_available ? <Badge tone="outline">Not available tonight</Badge> : null}
          </div>

          {dish.category ? (
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-mute">{dish.category.name}</p>
          ) : null}
          <h1 className="mt-2 text-4xl sm:text-5xl">{dish.name}</h1>
          <p className="mt-4 text-2xl text-ivory">{formatPrice(dish.price, restaurant.currency)}</p>

          <div className="mt-5">
            {auth ? (
              <FavoriteButton menuItemId={dish.id} slug={dish.slug} initialFavorited={favorited} />
            ) : (
              <Link
                href={`/signin?next=${encodeURIComponent(`/menu/${dish.slug}`)}`}
                className={buttonStyles({ variant: "outline" })}
              >
                Sign in to save this dish
              </Link>
            )}
          </div>

          {dish.description ? <p className="mt-6 text-mute">{dish.description}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <SpiceLevel level={dish.spice_level} />
            {dish.dietary_tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {dish.dietary_tags.map((tag) => (
                  <Badge key={tag} tone="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {dish.story ? (
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-mute">The story</p>
              <p className="mt-2 text-mute">{dish.story}</p>
            </div>
          ) : null}

          {ingredients.length > 0 ? (
            <div className="mt-6 border-t border-line pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-mute">Ingredients</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    <Badge tone="outline">{ingredient.name}</Badge>
                  </li>
                ))}
              </ul>
              <Link href="/our-ingredients" className="mt-3 inline-block text-sm text-ivory underline-offset-4 hover:underline">
                Where our ingredients come from
              </Link>
            </div>
          ) : null}

          {dish.chef_note ? (
            <div className="mt-6 border-t border-line pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-mute">Chef&rsquo;s note</p>
              <p className="mt-2 text-mute">{dish.chef_note}</p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/reserve" className={buttonStyles()}>
              Reserve a table
            </Link>
            <Link href="/menu" className={buttonStyles({ variant: "outline" })}>
              See more dishes
            </Link>
          </div>
        </div>
      </div>

      <DishReviews reviews={reviews} />
    </div>
  );
}
