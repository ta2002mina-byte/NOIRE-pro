import type { Metadata } from "next";

import { NotificationList } from "@/components/account/notification-list";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getCustomerNotifications } from "@/lib/data/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function Page() {
  const ctx = await requireAccess("/account/notifications");
  const notifications = await getCustomerNotifications(ctx.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ivory">Notifications</h1>
        <p className="mt-1 text-sm text-mute">Updates about your reservations from the restaurant.</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When the restaurant confirms or changes a reservation, you’ll see it here."
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
