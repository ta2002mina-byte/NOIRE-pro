import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import type { GalleryImage } from "@/lib/data/gallery";

export function SpacesSection({ images }: { images: GalleryImage[] }) {
  const preview = images.slice(0, 5);

  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker="The room" title="Restaurant spaces" link={{ href: "/space", label: "Tour every space" }} />

        {preview.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {preview.map((image) => (
              <Media key={image.id} src={image.image_url} alt={image.alt_text ?? image.space ?? "NOIRÉ"} ratio="aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="Photos of the room are coming."
            description="A look at the dining room, bar and private spaces will appear here."
          />
        )}
      </div>
    </section>
  );
}
