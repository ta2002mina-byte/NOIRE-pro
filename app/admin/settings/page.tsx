import type { Metadata } from "next";

import { RestaurantSettingsForm } from "@/components/admin/restaurant-settings-form";
import { requireAccess } from "@/lib/auth/session";
import { updateRestaurantSettingsAction } from "@/lib/actions/settings";
import { getRestaurantForAdmin } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  await requireAccess("/admin/settings");

  const restaurant = await getRestaurantForAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Settings</h1>
        <p className="mt-2 max-w-prose text-mute">
          Restaurant details, opening hours and reservation rules. Admins only — staff can’t open this page.
        </p>
      </div>
      <RestaurantSettingsForm restaurant={restaurant} action={updateRestaurantSettingsAction} />
    </div>
  );
}
