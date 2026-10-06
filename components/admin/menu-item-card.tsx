import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { QuickActionButton } from "@/components/admin/quick-action-button";
import { deleteMenuItemAction, toggleMenuItemAvailableAction } from "@/lib/actions/menu";
import type { AdminMenuItem } from "@/lib/data/menu";

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function MenuItemCard({ item }: { item: AdminMenuItem }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-raised sm:flex-row">
      <Media src={item.image_url} alt={item.name} ratio="aspect-[3/2]" className="w-full sm:w-56 sm:shrink-0" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-ivory">{item.name}</p>
            <p className="text-sm text-mute">
              {formatPrice(item.price)}
              {item.category ? ` · ${item.category.name}` : ""}
            </p>
          </div>
          <Badge tone={item.is_available ? "default" : "outline"}>{item.is_available ? "Available" : "86'd"}</Badge>
        </div>

        {item.description ? <p className="line-clamp-2 text-sm text-mute">{item.description}</p> : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
          <span>Spice {item.spice_level}/5</span>
          {item.diet_type ? <span className="capitalize">{item.diet_type.replace("_", " ")}</span> : null}
          {item.is_featured ? <span>Featured</span> : null}
          {item.is_chef_choice ? <span>Chef&rsquo;s choice</span> : null}
          <span>Order {item.sort_order}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-2">
          <Link href={`/admin/menu/${item.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
          <QuickActionButton
            label={item.is_available ? "86 it" : "Make available"}
            action={() => toggleMenuItemAvailableAction(item.id, !item.is_available)}
          />
          <ConfirmActionButton
            label="Delete"
            confirmMessage={`Delete “${item.name}”?`}
            confirmLabel="Yes, delete"
            action={() => deleteMenuItemAction(item.id)}
          />
        </div>
      </div>
    </li>
  );
}
