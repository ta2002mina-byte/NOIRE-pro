import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Media } from "@/components/ui/media";
import { SpiceLevel } from "@/components/menu/spice-level";
import { formatPrice } from "@/lib/utils/format";
import type { MenuItemWithExtras } from "@/lib/data/menu";

export function DishCard({ dish, currency = "USD" }: { dish: MenuItemWithExtras; currency?: string }) {
  return (
    <Link
      href={`/menu/${dish.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      <div className="relative">
        <Media
          src={dish.image_url}
          alt={dish.name}
          ratio="aspect-[4/3]"
          className="transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {dish.is_chef_choice ? <Badge tone="claret">Chef&rsquo;s Choice</Badge> : null}
          {dish.is_featured ? <Badge tone="outline">Featured</Badge> : null}
        </div>
        {!dish.is_available ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/70">
            <Badge tone="outline">Not available tonight</Badge>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg text-ivory">{dish.name}</h3>
          {dish.category ? <p className="mt-1 text-xs uppercase tracking-[0.08em] text-mute">{dish.category.name}</p> : null}
        </div>
        <p className="whitespace-nowrap text-ivory">{formatPrice(dish.price, currency)}</p>
      </div>

      {dish.description ? <p className="mt-2 line-clamp-2 text-sm text-mute">{dish.description}</p> : null}

      <div className="mt-3 flex items-center gap-3">
        <SpiceLevel level={dish.spice_level} />
        {dish.dietary_tags?.length ? (
          <span className="text-xs text-mute">{dish.dietary_tags.join(" · ")}</span>
        ) : null}
      </div>
    </Link>
  );
}
