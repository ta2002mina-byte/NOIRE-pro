import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteGalleryImageButton } from "@/components/admin/delete-gallery-image-button";
import { GalleryForm } from "@/components/admin/gallery-form";
import { updateGalleryImageAction } from "@/lib/actions/gallery";
import { requireAccess } from "@/lib/auth/session";
import { getGalleryImageByIdForAdmin } from "@/lib/data/gallery";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit photo" };

export default async function EditGalleryImagePage({ params }: PageProps) {
  await requireAccess("/admin/gallery");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const image = restaurant ? await getGalleryImageByIdForAdmin(restaurant.id, id) : null;
  if (!image) notFound();

  const updateThisImage = updateGalleryImageAction.bind(null, image.id);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl">Edit photo</h1>
        <DeleteGalleryImageButton id={image.id} redirectTo="/admin/gallery" />
      </div>
      <GalleryForm image={image} action={updateThisImage} />
    </div>
  );
}
