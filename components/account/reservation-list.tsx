import { Badge } from "@/components/ui/badge";
import { CancelReservationButton } from "@/components/account/cancel-reservation-button";
import {
  areaLabel,
  formatSlotLabel,
  LIVE_RESERVATION_STATUSES,
  occasionLabel,
  preferenceLabel,
  RESERVATION_STATUS_LABELS,
} from "@/lib/constants/reservation";
import type { CustomerReservation } from "@/lib/data/reservation";
import { formatDateOnly } from "@/lib/utils/format";

function statusTone(status: string): "default" | "claret" | "outline" {
  if (status === "confirmed" || status === "completed") return "default";
  if (status === "cancelled" || status === "no_show") return "outline";
  return "claret";
}

function ReservationCard({ reservation }: { reservation: CustomerReservation }) {
  const canCancel = LIVE_RESERVATION_STATUSES.includes(
    reservation.status as (typeof LIVE_RESERVATION_STATUSES)[number],
  );
  const preferences = reservation.reservation_preferences.map((p) => p.preference);

  return (
    <li className="rounded-2xl border border-line bg-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl text-ivory">
            {formatDateOnly(reservation.reservation_date)} · {formatSlotLabel(reservation.reservation_time.slice(0, 5))}
          </p>
          <p className="mt-1 text-sm text-mute">
            {reservation.guest_count} {reservation.guest_count === 1 ? "guest" : "guests"}
            {reservation.tables ? ` · Table ${reservation.tables.label} (${areaLabel(reservation.tables.area)})` : ""}
          </p>
        </div>
        <Badge tone={statusTone(reservation.status)}>
          {RESERVATION_STATUS_LABELS[reservation.status] ?? reservation.status}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {reservation.dining_experiences ? (
          <div>
            <dt className="text-mute">Experience</dt>
            <dd className="text-ivory">{reservation.dining_experiences.title}</dd>
          </div>
        ) : null}
        {reservation.occasion ? (
          <div>
            <dt className="text-mute">Occasion</dt>
            <dd className="text-ivory">{occasionLabel(reservation.occasion)}</dd>
          </div>
        ) : null}
        {preferences.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-mute">Preferences</dt>
            <dd className="text-ivory">{preferences.map((p) => preferenceLabel(p)).join(", ")}</dd>
          </div>
        ) : null}
        {reservation.special_request ? (
          <div className="sm:col-span-2">
            <dt className="text-mute">Special request</dt>
            <dd className="text-ivory">{reservation.special_request}</dd>
          </div>
        ) : null}
      </dl>

      {canCancel ? (
        <div className="mt-4 flex justify-end">
          <CancelReservationButton reservationId={reservation.id} />
        </div>
      ) : null}
    </li>
  );
}

export function ReservationList({ reservations }: { reservations: CustomerReservation[] }) {
  const upcoming = reservations.filter((r) =>
    LIVE_RESERVATION_STATUSES.includes(r.status as (typeof LIVE_RESERVATION_STATUSES)[number]),
  );
  const past = reservations.filter(
    (r) => !LIVE_RESERVATION_STATUSES.includes(r.status as (typeof LIVE_RESERVATION_STATUSES)[number]),
  );

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-mute">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-mute">No upcoming reservations.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {upcoming.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-mute">Past & cancelled</h2>
          <ul className="mt-4 space-y-4">
            {past.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
