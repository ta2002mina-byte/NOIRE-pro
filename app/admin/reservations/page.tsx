import type { Metadata } from "next";

import { FloorPlan, type TableStatus } from "@/components/admin/floor-plan";
import { ReservationFilters } from "@/components/admin/reservation-filters";
import { ReservationTable } from "@/components/admin/reservation-table";
import { Pagination } from "@/components/ui/pagination";
import { requireAccess } from "@/lib/auth/session";
import { todayDateString } from "@/lib/constants/reservation";
import { getAllTablesForAdmin, getReservationsForAdmin, getReservationStatusesForDate } from "@/lib/data/reservation";
import { getRestaurant } from "@/lib/data/restaurant";
import type { ReservationStatus } from "@/lib/validations/reservation";
import { RESERVATION_STATUSES } from "@/lib/validations/reservation";

export const metadata: Metadata = { title: "Reservations" };

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ date?: string; status?: string; search?: string; page?: string }>;
}

function isReservationStatus(value: string | undefined): value is ReservationStatus {
  return !!value && (RESERVATION_STATUSES as readonly string[]).includes(value);
}

export default async function AdminReservationsPage({ searchParams }: PageProps) {
  await requireAccess("/admin/reservations");
  const params = await searchParams;
  const date = params.date ?? todayDateString();
  const status = isReservationStatus(params.status) ? params.status : "";
  const search = params.search ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const restaurant = await getRestaurant();
  // No `date` param at all (first visit) defaults to today's list; an explicitly cleared
  // date field (submitted as "") shows every date instead — that's the one case this
  // list can grow large, hence pagination.
  const dateFilter = params.date === undefined ? date : params.date || undefined;
  const [reservationsPage, tables, statusRows] = restaurant
    ? await Promise.all([
        getReservationsForAdmin(
          restaurant.id,
          { date: dateFilter, status: status || undefined, search },
          { page, pageSize: PAGE_SIZE },
        ),
        getAllTablesForAdmin(restaurant.id),
        // Always scoped to the displayed date (not the possibly-wider/paginated list
        // above), so the floor plan never reflects just one page of a busy date.
        getReservationStatusesForDate(restaurant.id, date),
      ])
    : [{ reservations: [], total: 0 }, [], []];
  const { reservations, total } = reservationsPage;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusByTable = new Map<string, TableStatus>();
  for (const row of statusRows) {
    if (row.table_id) statusByTable.set(row.table_id, { tableId: row.table_id, state: "booked" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Reservations</h1>
        <p className="mt-2 max-w-prose text-mute">
          Every booking, with the same table, guest count, experience, occasion and preference details the guest
          chose. Change status inline, or open a reservation to edit any field.
        </p>
      </div>

      <ReservationFilters date={date} status={status} search={search} />

      <section className="space-y-3">
        <h2 className="text-lg text-ivory">Floor status — {date}</h2>
        <FloorPlan tables={tables} statusByTable={statusByTable} />
      </section>

      <ReservationTable reservations={reservations} />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        itemLabel="reservations"
        basePath="/admin/reservations"
        params={{ date: params.date ?? "", status, search }}
      />
    </div>
  );
}
