import type { Metadata } from "next";

import { AnalyticsBarList } from "@/components/admin/analytics-bar-list";
import { AnalyticsDailyChart } from "@/components/admin/analytics-daily-chart";
import { AnalyticsRangeFilter } from "@/components/admin/analytics-range-filter";
import { requireAccess } from "@/lib/auth/session";
import { isAnalyticsRange, type AnalyticsRangeValue } from "@/lib/constants/analytics";
import { getAnalyticsSnapshot } from "@/lib/data/analytics";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Analytics" };

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <p className="text-3xl text-ivory">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-mute">{label}</p>
      {hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-line p-5">
      <div>
        <h2 className="text-lg text-ivory">{title}</h2>
        {note ? <p className="text-xs text-mute">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  await requireAccess("/admin/analytics");
  const params = await searchParams;
  const range: AnalyticsRangeValue = isAnalyticsRange(params.range) ? params.range : "30";

  const restaurant = await getRestaurant();
  const stats = restaurant ? await getAnalyticsSnapshot(restaurant.id, range) : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl">Analytics</h1>
          <p className="mt-2 text-mute">Reservations, guests, taste and story activity — aggregated, no individual guest data shown.</p>
        </div>
        <AnalyticsRangeFilter active={range} />
      </div>

      {!stats ? (
        <div className="rounded-2xl border border-line p-6 sm:p-8">
          <p className="text-mute">No restaurant record yet — set one up to see analytics here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Reservations" value={String(stats.reservations.total)} hint={stats.rangeLabel} />
            <StatCard label="Guests seated" value={String(stats.reservations.totalGuests)} hint="Pending, confirmed & completed" />
            <StatCard label="Verified visits" value={String(stats.visits.totalVisits)} hint="From the dining journal record" />
            <StatCard
              label="Table occupancy"
              value={stats.tables.activeTableCount > 0 ? `${stats.tables.averageOccupancyPercent}%` : "—"}
              hint={stats.tables.daysMeasured > 0 ? `Avg. across ${stats.tables.daysMeasured} day${stats.tables.daysMeasured === 1 ? "" : "s"}` : "No bookings yet"}
            />
          </div>

          <Panel title="Reservation volume" note="Most recent 30 days shown, by booking date">
            <AnalyticsDailyChart data={stats.reservations.dailyVolume} />
          </Panel>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Cancellation rate" value={`${stats.reservations.cancellationRatePercent}%`} />
            <StatCard label="No-show rate" value={`${stats.reservations.noShowRatePercent}%`} />
            <StatCard
              label="Chose an experience"
              value={`${stats.reservations.experienceConversionPercent}%`}
              hint="Of active reservations"
            />
            <StatCard
              label="Repeat guests"
              value={stats.visits.distinctCustomers > 0 ? `${stats.visits.repeatRatePercent}%` : "—"}
              hint={`${stats.visits.repeatCustomers} of ${stats.visits.distinctCustomers} guests`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Choose Your Experience — selections">
              <AnalyticsBarList
                rows={stats.experiences.map((e) => ({ label: e.title, count: e.count }))}
                emptyLabel="No experience was selected in this period."
              />
            </Panel>
            <Panel title="Occasions">
              <AnalyticsBarList
                rows={stats.occasions.map((o) => ({ label: o.label, count: o.count }))}
                emptyLabel="No occasion was noted in this period."
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Most journaled dishes" note="Dishes guests actually dined and logged">
              <AnalyticsBarList
                rows={stats.dishes.mostJournaled.map((d) => ({ label: d.name, count: d.count }))}
                emptyLabel="No journal entries logged a dish in this period."
              />
            </Panel>
            <Panel title="Most favorited dishes" note="Added to favorites in this period">
              <AnalyticsBarList
                rows={stats.dishes.mostFavorited.map((d) => ({ label: d.name, count: d.count }))}
                emptyLabel="No dishes were favorited in this period."
              />
            </Panel>
          </div>

          <Panel title="Dining journal activity">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Entries logged" value={String(stats.journal.totalEntries)} />
              <StatCard label="With a rating" value={String(stats.journal.ratedEntries)} />
              <StatCard label="Average rating" value={stats.journal.averageRating !== null ? `${stats.journal.averageRating} / 5` : "—"} />
            </div>
          </Panel>

          <div>
            <h2 className="text-xl text-ivory">Taste analytics</h2>
            <p className="mt-1 text-sm text-mute">
              From {stats.taste.profilesSaved} saved taste profile{stats.taste.profilesSaved === 1 ? "" : "s"} — a current
              snapshot of stated preferences, not a log of every Find My Dish quiz run.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel title="Popular moods">
                <AnalyticsBarList
                  rows={stats.taste.moods.map((m) => ({ label: m.label, count: m.count }))}
                  emptyLabel="No customer has saved a mood preference yet."
                />
              </Panel>
              <Panel title="Spice preference">
                <AnalyticsBarList
                  rows={stats.taste.spiceLevels.map((s) => ({ label: s.label, count: s.count }))}
                  emptyLabel="No customer has saved a spice preference yet."
                />
              </Panel>
              <Panel title="Flavor preferences">
                <AnalyticsBarList
                  rows={stats.taste.flavors.map((f) => ({ label: f.value, count: f.count }))}
                  emptyLabel="No customer has saved a flavor preference yet."
                />
              </Panel>
              <Panel title="Texture preferences">
                <AnalyticsBarList
                  rows={stats.taste.textures.map((t) => ({ label: t.value, count: t.count }))}
                  emptyLabel="No customer has saved a texture preference yet."
                />
              </Panel>
            </div>
          </div>

          <Panel title="Story activity" note="No page-view tracking exists in NOIRÉ yet, so this reports publishing activity, not reader engagement">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Live right now" value={String(stats.stories.liveNow)} />
              <StatCard label="Published in period" value={String(stats.stories.publishedInRange)} hint={stats.rangeLabel} />
            </div>
            <AnalyticsBarList
              rows={stats.stories.byType.map((t) => ({ label: t.label, count: t.count }))}
              emptyLabel="No story was published in this period."
            />
          </Panel>
        </>
      )}
    </div>
  );
}
