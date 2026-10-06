import { AssistantMount } from "@/components/assistant/assistant-mount";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { RestaurantJsonLd } from "@/components/layout/restaurant-jsonld";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * The frame shared by every public page: skip link, header, main landmark, footer.
 * Pages render only their own content, so the landmark structure exists once.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <RestaurantJsonLd />
      <a
        href="#main"
        className="sr-only rounded-full bg-ivory px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to main content
      </a>
      <AnnouncementBanner />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
      <AssistantMount />
      <CookieNotice />
    </div>
  );
}
