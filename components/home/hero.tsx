import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { SITE_CONTENT_DEFAULTS as D } from "@/lib/constants/site-content";
import type { SiteContent } from "@/lib/data/site-content";
import { isOptimizableImageHost } from "@/lib/utils/image";
import { isInternalHref } from "@/lib/utils/site-links";

/** A button-styled link: next/link for pages on this site, a plain anchor for #sections and other sites. */
function HeroLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

export function Hero({ heroImageUrl, content }: { heroImageUrl: string | null; content?: SiteContent | null }) {
  // Every field is optional in the admin; blank falls back to the original copy.
  const eyebrow = content?.hero_eyebrow || D.heroEyebrow;
  const heading = content?.hero_heading || D.heroHeading;
  const subtext = content?.hero_subtext || D.heroSubtext;
  const primaryLabel = content?.hero_primary_label || D.heroPrimaryLabel;
  const primaryHref = content?.hero_primary_href || D.heroPrimaryHref;
  const secondaryLabel = content?.hero_secondary_label || D.heroSecondaryLabel;
  const secondaryHref = content?.hero_secondary_href || D.heroSecondaryHref;

  return (
    <section className="relative flex min-h-[92dvh] flex-col justify-end overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {heroImageUrl ? (
          // Above-the-fold, full-bleed — this is the page's LCP element, so it's
          // `priority` (skip lazy-loading) with no `sizes` cap (always ~100vw).
          <Image
            src={heroImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized={!isOptimizableImageHost(heroImageUrl)}
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-surface via-ink to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-40 sm:pb-28">
        <p className="text-xs uppercase tracking-[0.4em] text-blush">{eyebrow}</p>
        <h1 className="mt-6 max-w-4xl text-5xl leading-[1.03] sm:text-7xl lg:text-8xl">
          {heading}
        </h1>
        <p className="mt-6 max-w-md text-lg text-mute">{subtext}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <HeroLink href={primaryHref} className={buttonStyles({ size: "lg" })}>
            {primaryLabel}
          </HeroLink>
          <HeroLink href={secondaryHref} className={buttonStyles({ variant: "outline", size: "lg" })}>
            {secondaryLabel}
          </HeroLink>
        </div>
      </div>

      <a
        href="#tonight"
        className="group mb-8 hidden items-center gap-2 self-center text-xs uppercase tracking-[0.2em] text-mute transition-colors hover:text-ivory sm:flex"
      >
        Scroll to enter
        <ChevronDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
      </a>
    </section>
  );
}
