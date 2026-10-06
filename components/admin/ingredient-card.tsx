import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { DeleteIngredientButton } from "@/components/admin/delete-ingredient-button";
import type { IngredientWithSourcing } from "@/lib/data/ingredients";

export function IngredientCard({ ingredient }: { ingredient: IngredientWithSourcing }) {
  const publishedSources = ingredient.ingredient_sources.filter((s) => s.is_published).length;

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-raised sm:flex-row">
      <Media src={ingredient.image_url} alt={ingredient.name} ratio="aspect-[3/2]" className="w-full sm:w-56 sm:shrink-0" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-ivory">{ingredient.name}</p>
            {ingredient.season ? <p className="text-sm text-mute">Season: {ingredient.season}</p> : null}
          </div>
          <Badge tone={ingredient.is_active ? "claret" : "outline"}>{ingredient.is_active ? "Active" : "Inactive"}</Badge>
        </div>

        {ingredient.description ? <p className="line-clamp-2 text-sm text-mute">{ingredient.description}</p> : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
          <span>
            {ingredient.ingredient_sources.length} source{ingredient.ingredient_sources.length === 1 ? "" : "s"}
            {ingredient.ingredient_sources.length > 0 ? ` (${publishedSources} published)` : ""}
          </span>
          <span>
            {ingredient.dishes.length} dish{ingredient.dishes.length === 1 ? "" : "es"}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-2">
          <Link href={`/admin/ingredients/${ingredient.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
          <DeleteIngredientButton
            id={ingredient.id}
            name={ingredient.name}
            sourceCount={ingredient.ingredient_sources.length}
            dishCount={ingredient.dishes.length}
          />
        </div>
      </div>
    </li>
  );
}
