import Image from "next/image";
import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { PUBLIC_NAV } from "@/lib/constants/navigation";
import { SITE_CONTENT_DEFAULTS as D } from "@/lib/constants/site-content";
import { getRestaurant, formatLocationLine } from "@/lib/data/restaurant";
import { getSiteContent } from "@/lib/data/site-content";
import { isOptimizableImageHost } from "@/lib/utils/image";
import { isInternalHref, normalizeFooterLinks } from "@/lib/utils/site-links";

export async function SiteFooter() {
  const restaurant = await getRestaurant();
  const location = restaurant ? formatLocationLine(restaurant) : null;
  const content = await getSiteContent();

  const footerLogo = content?.footer_logo_url || null;
  const footerImage = content?.footer_image_url || null;
  const tagline = content?.footer_tagline || D.footerTagline;
  const copyright = (content?.footer_copyright || D.footerCopyright)
    .replaceAll("{year}", String(new Date().getFullYear()))
    .replaceAll("{name}", restaurant?.name ?? "NOIRÉ");
  const extraLinks = normalizeFooterLinks(content?.footer_links);
  const socials = [
    { label: "Instagram", href: content?.footer_instagram_url },
    { label: "Facebook", href: content?.footer_facebook_url },
    { label: "TikTok", href: content?.footer_tiktok_url },
    { label: "YouTube", href: content?.footer_youtube_url },
    { label: "X", href: content?.footer_x_url },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));

  return (
    <footer className="relative isolate overflow-hidden border-t border-line">
      {footerImage ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={footerImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
            unoptimized={!isOptimizableImageHost(footerImage)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink/90" />
        </div>
      ) : null}
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label={`${restaurant?.name ?? "NOIRÉ"}, home`}>
              {footerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-supplied logo of unknown size/host
                <img src={footerLogo} alt={restaurant?.name ?? "NOIRÉ"} className="h-10 w-auto max-w-[12rem] object-contain" />
              ) : (
                <Wordmark className="text-lg" />
              )}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-mute">{tagline}</p>
            {socials.length > 0 ? (
              <ul aria-label="Social media" className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-mute hover:text-ivory"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Explore" className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-mute">Explore</p>
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-mute hover:text-ivory">
                {item.label}
              </Link>
            ))}
            {extraLinks.map((item) =>
              isInternalHref(item.href) ? (
                <Link key={`${item.label}-${item.href}`} href={item.href} className="text-sm text-mute hover:text-ivory">
                  {item.label}
                </Link>
              ) : (
                <a
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="text-sm text-mute hover:text-ivory"
                  {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-mute">Visit</p>
            {restaurant?.address_line ? <p className="text-sm text-mute">{restaurant.address_line}</p> : null}
            {location ? <p className="text-sm text-mute">{location}</p> : null}
            {restaurant?.phone ? (
              <a href={`tel:${restaurant.phone}`} className="text-sm text-mute hover:text-ivory">
                {restaurant.phone}
              </a>
            ) : null}
            {restaurant?.email ? (
              <a href={`mailto:${restaurant.email}`} className="text-sm text-mute hover:text-ivory">
                {restaurant.email}
              </a>
            ) : null}
            {!restaurant ? <p className="text-sm text-mute">Details coming soon.</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-mute">Account</p>
            <Link href="/signin" className="text-sm text-mute hover:text-ivory">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm text-mute hover:text-ivory">
              Create account
            </Link>
            <Link href="/reserve" className="text-sm text-mute hover:text-ivory">
              Reservations
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-ivory">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ivory">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-ivory">
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
