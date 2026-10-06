import type { Metadata } from "next";

import { SiteContentForm } from "@/components/admin/site-content-form";
import { requireAccess } from "@/lib/auth/session";
import { updateSiteContentAction } from "@/lib/actions/site-content";
import { getRestaurant } from "@/lib/data/restaurant";
import { getSiteContent } from "@/lib/data/site-content";

export const metadata: Metadata = { title: "Site content" };

export default async function AdminContentPage() {
  await requireAccess("/admin/content");
  const restaurant = await getRestaurant();
  const content = restaurant ? await getSiteContent() : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Site content</h1>
        <p className="mt-2 max-w-prose text-mute">
          The homepage hero, the announcement banner and the footer. Changes go live as soon as you save.
        </p>
      </div>

      {restaurant ? (
        <SiteContentForm content={content} timezone={restaurant.timezone} action={updateSiteContentAction} />
      ) : (
        <p className="max-w-prose text-mute">
          Create the restaurant record in Settings first — site content is saved against it.
        </p>
      )}
    </div>
  );
}
