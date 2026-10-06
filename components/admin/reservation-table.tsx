import Link from "next/link";

import { ReservationStatusSelect } from "@/components/admin/reservation-status-select";
import { EmptyState } from "@/components/ui/empty-state";
import { areaLabel, occasionLabel } from "@/lib/constants/reservation";
import type { AdminReservation } from "@/lib/data/reservation";
import type { ReservationStatus } from "@/lib/validations/reservation";

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number.parseInt(hStr, 10);
  if (!Number.isFinite(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

export function ReservationTable({ reservations }: { reservations: AdminReservation[] }) {
  if (reservations.length === 0) {
    return <EmptyState title="No reservations match these filters." description="Try a different date, status or search." />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-mute">
            <th className="px-4 py-3 font-normal">Date &amp; time</th>
            <th className="px-4 py-3 font-normal">Guest</th>
            <th className="px-4 py-3 font-normal">Party</th>
            <th className="px-4 py-3 font-normal">Table</th>
            <th className="px-4 py-3 font-normal">Experience</th>
            <th className="px-4 py-3 font-normal">Occasion</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal sr-only">Edit</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => {
            const guestName = reservation.profiles?.full_name ?? reservation.contact_name ?? "Guest";
            const guestContact = reservation.profiles?.email ?? reservation.contact_email ?? reservation.contact_phone;

            return (
              <tr key={reservation.id} className="border-b border-line last:border-0 hover:bg-raised/50">
                <td className="px-4 py-3 text-ivory">
                  <div>{reservation.reservation_date}</div>
                  <div className="text-xs text-mute">{formatTime(reservation.reservation_time.slice(0, 5))}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-ivory">{guestName}</div>
                  {guestContact ? <div className="text-xs text-mute">{guestContact}</div> : null}
                </td>
                <td className="px-4 py-3 text-ivory">{reservation.guest_count}</td>
                <td className="px-4 py-3 text-mute">
                  {reservation.tables ? `${reservation.tables.label} · ${areaLabel(reservation.tables.area)}` : "Unassigned"}
                </td>
                <td className="px-4 py-3 text-mute">{reservation.dining_experiences?.title ?? "—"}</td>
                <td className="px-4 py-3 text-mute">{occasionLabel(reservation.occasion) ?? "—"}</td>
                <td className="px-4 py-3">
                  <ReservationStatusSelect id={reservation.id} status={reservation.status as ReservationStatus} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/reservations/${reservation.id}`} className="text-xs text-ivory underline underline-offset-4">
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
