import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { requireAccess } from "@/lib/auth/session";
import { formatSlotLabel, occasionLabel, RESERVATION_STATUS_LABELS } from "@/lib/constants/reservation";
import { getOverviewStats } from "@/lib/data/admin-overview";
import { getRestaurant } from "@/lib/data/restaurant";

export default async function AdminOverviewPage() {
  const { role } = await requireAccess("/admin");
  const restaurant = await getRestaurant();
  const stats = restaurant ? await getOverviewStats(restaurant.id) : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl sm:text-5xl">Overview</h1>
        <p className="mt-2 text-mute">
          Signed in with the <span className="text-ivory">{role}</span> role.
          {role === "admin" ? " You can open every section, including Settings." : " Settings is reserved for admins."}
        </p>
      </div>

      {!stats ? (
        <div className="rounded-2xl border border-line p-6 sm:p-8">
          <p className="text-mute">No restaurant record yet — set one up to see live numbers here.</p>
        </div>
      ) : (
        <>
          {stats.alerts.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-danger/40 bg-danger/5 p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-ivory">
                <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
                Operational alerts
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-mute">
                {stats.alerts.map((alert) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-line p-5">
              <p className="text-3xl text-ivory">{stats.activeReservationsToday}</p>
              <p className="text-xs uppercase tracking-[0.08em] text-mute">Reservations today</p>
            </div>
            <div className="rounded-2xl border border-line p-5">
              <p className="text-3xl text-ivory">{stats.totalGuestsToday}</p>
              <p className="text-xs uppercase tracking-[0.08em] text-mute">Guests today</p>
            </div>
            <div className="rounded-2xl border border-line p-5">
              <p className="text-3xl text-ivory">{stats.occupancyPercent}%</p>
              <p className="text-xs uppercase tracking-[0.08em] text-mute">
                Table occupancy ({stats.tablesBookedToday}/{stats.activeTableCount})
              </p>
            </div>
            <div className="rounded-2xl border border-line p-5">
              <p className="text-3xl text-ivory">{stats.occasionBreakdown.reduce((sum, o) => sum + o.count, 0)}</p>
              <p className="text-xs uppercase tracking-[0.08em] text-mute">Special occasions today</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="space-y-3 rounded-2xl border border-line p-5">
              <h2 className="text-lg text-ivory">Experience breakdown — today</h2>
              {stats.experienceBreakdown.length === 0 ? (
                <p className="text-sm text-mute">No experiences selected for today yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {stats.experienceBreakdown.map((row) => (
                    <li key={row.title} className="flex items-center justify-between text-ivory">
                      <span>{row.title}</span>
                      <span className="text-mute">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3 rounded-2xl border border-line p-5">
              <h2 className="text-lg text-ivory">Occasions — today</h2>
              {stats.occasionBreakdown.length === 0 ? (
                <p className="text-sm text-mute">No occasions noted for today.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {stats.occasionBreakdown.map((row) => (
                    <li key={row.occasion} className="flex items-center justify-between text-ivory">
                      <span>{occasionLabel(row.occasion) ?? row.occasion}</span>
                      <span className="text-mute">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-ivory">Recent activity</h2>
              <Link href="/admin/reservations" className="text-sm text-ivory underline underline-offset-4">
                All reservations
              </Link>
            </div>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-mute">Nothing booked yet.</p>
            ) : (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {stats.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="text-ivory">{activity.guestName}</span>
                    <span className="text-mute">
                      {activity.date} · {formatSlotLabel(activity.time.slice(0, 5))} ·{" "}
                      {RESERVATION_STATUS_LABELS[activity.status] ?? activity.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
