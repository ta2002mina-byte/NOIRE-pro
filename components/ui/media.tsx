import Image from "next/image";

import { cn } from "@/lib/utils";
import { isOptimizableImageHost } from "@/lib/utils/image";

export function Media({
  src,
  alt,
  className,
  ratio = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  ratio?: string;
  /** Passed straight to next/image; override for full-bleed or fixed-width usages. */
  sizes?: string;
  /** Marks this image as LCP-critical (skips lazy-loading). Use sparingly — one per page, above the fold. */
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          ratio,
          "flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-raised to-ink",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="font-display text-3xl tracking-[0.3em] text-line">N</span>
      </div>
    );
  }

  return (
    <div className={cn(ratio, "relative overflow-hidden rounded-xl bg-raised", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!isOptimizableImageHost(src)}
        className="object-cover"
      />
    </div>
  );
}
