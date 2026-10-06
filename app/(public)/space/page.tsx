import type { Metadata } from "next";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { getRestaurant } from "@/lib/data/restaurant";
import { getGalleryImages, groupGalleryBySpace } from "@/lib/data/gallery";

export const metadata: Metadata = {
  title: "Space",
  description: "A look at the rooms and spaces at NOIRÉ.",
  alternates: { canonical: "/space" },
};

export default async function SpacePage() {
  const restaurant = await getRestaurant();
  const images = restaurant ? await getGalleryImages(restaurant.id) : [];
  const groups = groupGalleryBySpace(images);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
      <SectionHeading level={1} kicker="The room" title="Restaurant spaces" description="A look at the rooms at NOIRÉ." />

      {groups.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Photos of the room are coming."
          description="A look at the dining room, bar and private spaces will appear here."
        />
      ) : (
        <div className="mt-14 space-y-16">
          {groups.map((group) => (
            <section key={group.space}>
              <h2 className="text-2xl text-ivory">{group.space}</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {group.images.map((image) => (
                  <figure key={image.id}>
                    <Media src={image.image_url} alt={image.alt_text ?? group.space} ratio="aspect-[4/5]" />
                    {image.caption ? <figcaption className="mt-2 text-xs text-mute">{image.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
