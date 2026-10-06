"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { setFavoriteAction } from "@/lib/actions/favorites";
import type { FavoriteEntry } from "@/lib/data/favorites";
import { formatPrice } from "@/lib/utils/format";

export function FavoriteCard({ favorite, currency = "USD" }: { favorite: FavoriteEntry; currency?: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const dish = favorite.menuItem;

  return (
    <li className="flex gap-4 rounded-2xl border border-line bg-raised p-5">
      <Media
        src={dish?.image_url}
        alt={dish?.name ?? ""}
        ratio="aspect-square"
        className="w-20 shrink-0 sm:w-24"
        sizes="96px"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {dish ? (
              <Link href={`/menu/${dish.slug}`} className="font-display text-xl text-ivory hover:underline">
                {dish.name}
              </Link>
            ) : (
              <p className="font-display text-xl text-mute">This dish is no longer on the menu.</p>
            )}
            {dish ? <p className="mt-1 text-sm text-mute">{formatPrice(dish.price, currency)}</p> : null}
          </div>
          {dish && !dish.is_available ? <Badge tone="outline">Not available tonight</Badge> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size="sm"
            loading={pending}
            disabled={pending || !dish}
            onClick={() => {
              if (!dish) return;
              setError(null);
              startTransition(async () => {
                const result = await setFavoriteAction(dish.id, false, dish.slug);
                if (result.ok) {
                  router.refresh();
                } else {
                  setError(result.message);
                }
              });
            }}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
