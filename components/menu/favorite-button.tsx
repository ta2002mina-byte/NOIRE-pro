"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { setFavoriteAction } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  menuItemId: string;
  slug: string;
  initialFavorited: boolean;
  className?: string;
}

export function FavoriteButton({ menuItemId, slug, initialFavorited, className }: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className={className}>
      <button
        type="button"
        aria-pressed={favorited}
        disabled={pending}
        onClick={() => {
          setError(null);
          const next = !favorited;
          setFavorited(next); // optimistic — reverted below if the save fails
          startTransition(async () => {
            const result = await setFavoriteAction(menuItemId, next, slug);
            if (!result.ok) {
              setFavorited(!next);
              setError(result.message);
            } else {
              router.refresh();
            }
          });
        }}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          favorited
            ? "border-claret bg-claret/15 text-ivory hover:bg-claret/25"
            : "border-line text-ivory hover:border-ivory/60 hover:bg-raised",
        )}
      >
        <Heart className={cn("h-4 w-4", favorited && "fill-claret text-claret")} aria-hidden="true" />
        {favorited ? "Saved" : "Save dish"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
