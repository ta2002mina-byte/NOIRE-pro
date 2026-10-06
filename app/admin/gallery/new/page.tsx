import type { Metadata } from "next";

import { GalleryForm } from "@/components/admin/gallery-form";
import { createGalleryImageAction } from "@/lib/actions/gallery";
import { requireAccess } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Add photo" };

export default async function NewGalleryImagePage() {
  await requireAccess("/admin/gallery/new");

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl sm:text-4xl">Add photo</h1>
      <GalleryForm action={createGalleryImageAction} />
    </div>
  );
}
