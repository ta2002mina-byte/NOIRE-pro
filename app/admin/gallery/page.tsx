import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { DeleteGalleryImageButton } from "@/components/admin/delete-gallery-image-button";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { requireAccess } from "@/lib/auth/session";
import { getGalleryForAdmin } from "@/lib/data/gallery";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  await requireAccess("/admin/gallery");
  const restaurant = await getRestaurant();
  const images = restaurant ? await getGalleryForAdmin(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Gallery</h1>
          <p className="mt-2 max-w-prose text-mute">
            Photos of the rooms and spaces shown on the homepage and{" "}
            <Link href="/space" className="underline hover:text-ivory">
              /space
            </Link>
            . Grouped there by the “Space” name below.
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/gallery/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add photo
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState title="No restaurant record yet." description="Gallery photos are attached to a restaurant. Create the restaurant record first." />
      ) : images.length === 0 ? (
        <EmptyState title="No photos yet." description="Add the first photo of a room or space.">
          <Link href="/admin/gallery/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add photo
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li key={image.id} className="space-y-2">
              <Link href={`/admin/gallery/${image.id}`} className="block">
                <Media src={image.image_url} alt={image.alt_text ?? image.space ?? ""} ratio="aspect-[4/5]" />
              </Link>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ivory">{image.space || "Gallery"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={image.is_active ? "default" : "outline"}>{image.is_active ? "Active" : "Inactive"}</Badge>
                    <span className="text-xs text-mute">#{image.sort_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/admin/gallery/${image.id}`} className="text-xs text-ivory underline underline-offset-4">
                  Edit
                </Link>
                <DeleteGalleryImageButton id={image.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
