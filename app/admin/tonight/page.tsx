import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FloorPlan, type TableStatus } from "@/components/admin/floor-plan";
import { requireAccess } from "@/lib/auth/session";
import { formatSlotLabel, occasionLabel, preferenceLabel, RESERVATION_STATUS_LABELS, todayDateString } from "@/lib/constants/reservation";
import { STORY_TYPE_LABELS } from "@/lib/constants/labels";
import { getAllTablesForAdmin, getReservationsForAdmin } from "@/lib/data/reservation";
import { getLiveStories } from "@/lib/data/stories";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Tonight" };

export default async function AdminTonightPage() {
  await requireAccess("/admin/tonight");
  const restaurant = await getRestaurant();
  const today = todayDateString();

  const [reservationsPage, tables, stories] = restaurant
    ? await Promise.all([
        getReservationsForAdmin(restaurant.id, { date: today }),
        getAllTablesForAdmin(restaurant.id),
        getLiveStories(restaurant.id),
      ])
    : [{ reservations: [], total: 0 }, [], []];
  const reservations = reservationsPage.reservations;

  const live = reservations.filter((r) => r.status === "pending" || r.status === "confirmed");
  const sorted = [...live].sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));

  const statusByTable = new Map<string, TableStatus>();
  for (const r of live) {
    if (r.table_id) statusByTable.set(r.table_id, { tableId: r.table_id, state: "booked" });
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl sm:text-5xl">Tonight</h1>
        <p className="mt-2 max-w-prose text-mute">
          Everything the floor needs for {today}: upcoming guests, their table, experience, occasion and special
          requests, plus what&rsquo;s currently live on the public site.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg text-ivory">Floor status</h2>
        <FloorPlan tables={tables} statusByTable={statusByTable} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-ivory">Upcoming guests — {sorted.length}</h2>
          <Link href={`/admin/reservations?date=${today}`} className="text-sm text-ivory underline underline-offset-4">
            Full reservation list
          </Link>
        </div>

        {sorted.length === 0 ? (
          <EmptyState title="No live reservations for today." description="Pending, confirmed and completed bookings will show up here." />
        ) : (
          <ul className="space-y-3">
            {sorted.map((reservation) => {
              const guestName = reservation.profiles?.full_name ?? reservation.contact_name ?? "Guest";
              const preferences = reservation.reservation_preferences.map((p) => preferenceLabel(p.preference));

              return (
                <li key={reservation.id} className="rounded-2xl border border-line p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg text-ivory">
                        {formatSlotLabel(reservation.reservation_time.slice(0, 5))} · {guestName}
                      </p>
                      <p className="text-sm text-mute">
                        {reservation.guest_count} guests
                        {reservation.tables ? ` · Table ${reservation.tables.label}` : " · No table assigned"}
                        {reservation.dining_experiences ? ` · ${reservation.dining_experiences.title}` : ""}
                      </p>
                    </div>
                    <Badge tone={reservation.status === "confirmed" ? "default" : "outline"}>
                      {RESERVATION_STATUS_LABELS[reservation.status] ?? reservation.status}
                    </Badge>
                  </div>

                  {(reservation.occasion || preferences.length > 0) ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reservation.occasion ? <Badge tone="claret">{occasionLabel(reservation.occasion)}</Badge> : null}
                      {preferences.map((p) => (
                        <Badge key={p} tone="outline">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {reservation.special_request ? (
                    <p className="mt-3 text-sm text-ivory">
                      <span className="text-mute">Special request: </span>
                      {reservation.special_request}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-ivory">Live on the site right now</h2>
          <Link href="/admin/stories" className="text-sm text-ivory underline underline-offset-4">
            Manage stories
          </Link>
        </div>
        {stories.length === 0 ? (
          <EmptyState title="No stories are live right now." description="Publish one from Stories to feature it here and on /stories." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {stories.map((story) => (
              <li key={story.id}>
                <Badge>
                  {STORY_TYPE_LABELS[story.story_type] ?? story.story_type} · {story.title}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
