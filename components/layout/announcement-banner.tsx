import Link from "next/link";

import { getSiteContent, isBannerLive } from "@/lib/data/site-content";
import { isInternalHref } from "@/lib/utils/site-links";

/** Slim message bar above the header on every public page. Renders nothing unless
 * the banner is switched on and today falls inside its optional date window. */
export async function AnnouncementBanner() {
  const content = await getSiteContent();
  if (!content || !isBannerLive(content)) return null;

  const { banner_message: message, banner_link_label: label, banner_link_href: href } = content;
  const linkClass = "font-medium underline underline-offset-4 hover:text-ivory";

  return (
    <div role="region" aria-label="Announcement" className="border-b border-line bg-claret px-6 py-2.5 text-center text-sm text-ivory">
      <p>
        {message}
        {label && href ? (
          <>
            {" "}
            {isInternalHref(href) ? (
              <Link href={href} className={linkClass}>
                {label}
              </Link>
            ) : (
              <a
                href={href}
                className={linkClass}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {label}
              </a>
            )}
          </>
        ) : null}
      </p>
    </div>
  );
}
