import Link from "next/link";

import { RESERVATION_STATUS_LABELS } from "@/lib/constants/reservation";
import { RESERVATION_STATUSES } from "@/lib/validations/reservation";

interface ReservationFiltersProps {
  date: string;
  status: string;
  search: string;
}

/** A plain GET form — no client JS needed, and the filters live in the URL so they survive a refresh or a share. */
export function ReservationFilters({ date, status, search }: ReservationFiltersProps) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4" action="/admin/reservations">
      <div className="space-y-1.5">
        <label htmlFor="rf-date" className="block text-xs uppercase tracking-[0.08em] text-mute">
          Date
        </label>
        <input
          id="rf-date"
          type="date"
          name="date"
          defaultValue={date}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ivory"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rf-status" className="block text-xs uppercase tracking-[0.08em] text-mute">
          Status
        </label>
        <select
          id="rf-status"
          name="status"
          defaultValue={status}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ivory"
        >
          <option value="">Any status</option>
          {RESERVATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {RESERVATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-48 flex-1 space-y-1.5">
        <label htmlFor="rf-search" className="block text-xs uppercase tracking-[0.08em] text-mute">
          Search guest
        </label>
        <input
          id="rf-search"
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Name, email or phone"
          className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ivory placeholder:text-mute/70"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="h-10 rounded-full bg-claret px-5 text-sm font-medium text-ivory hover:bg-claret-hover">
          Apply
        </button>
        <Link href="/admin/reservations" className="flex h-10 items-center rounded-full border border-line px-5 text-sm text-ivory hover:border-ivory/60">
          Clear
        </Link>
      </div>
    </form>
  );
}
