"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { CustomerNotification } from "@/lib/data/notifications";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/** Only same-site relative links are followed; anything else is shown as plain text. */
function safeInternalLink(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("\\") ? url : null;
}

export function NotificationList({ notifications }: { notifications: CustomerNotification[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const unread = notifications.filter((n) => !n.read_at).length;

  function run(task: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute" aria-live="polite">
          {unread === 0 ? "You’re all caught up." : `${unread} unread`}
        </p>
        {unread > 0 ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => markAllNotificationsReadAction())}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {notifications.map((notification) => {
          const isUnread = !notification.read_at;
          const href = safeInternalLink(notification.link_url);
          return (
            <li
              key={notification.id}
              className={cn("rounded-2xl border p-4 sm:p-5", isUnread ? "border-ivory/40 bg-raised" : "border-line bg-surface")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-base text-ivory">
                    {isUnread ? <span className="sr-only">Unread: </span> : null}
                    {notification.title}
                  </h2>
                  {notification.body ? <p className="text-sm text-mute">{notification.body}</p> : null}
                  <p className="text-xs text-mute">{formatDateTime(notification.created_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {href ? (
                    <Link href={href} className="text-xs text-ivory underline underline-offset-4">
                      View
                    </Link>
                  ) : null}
                  {isUnread ? (
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => markNotificationReadAction(notification.id))}>
                      Mark read
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => deleteNotificationAction(notification.id))}>
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
