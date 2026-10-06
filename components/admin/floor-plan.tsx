import { areaLabel } from "@/lib/constants/reservation";
import { cn } from "@/lib/utils";
import type { ReservationTable } from "@/lib/data/reservation";

export interface TableStatus {
  tableId: string;
  /** "booked" — a pending/confirmed reservation occupies this table at the viewed time/date. */
  state: "free" | "booked" | "inactive";
  label?: string;
}

/** Read-only floor plan: each table's dot is colored by its current status,
 * reusing the same pos_x/pos_y/width/height layout as the guest-facing map. */
export function FloorPlan({ tables, statusByTable }: { tables: ReservationTable[]; statusByTable: Map<string, TableStatus> }) {
  if (tables.length === 0) {
    return <p className="text-sm text-mute">No tables configured yet.</p>;
  }

  return (
    <div>
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_top,_theme(colors.raised),_theme(colors.surface))] sm:aspect-[16/9]"
        role="img"
        aria-label="Restaurant floor plan, tables colored by current status"
      >
        {tables.map((table) => {
          const status = statusByTable.get(table.id);
          const state = !table.is_active ? "inactive" : (status?.state ?? "free");

          return (
            <div
              key={table.id}
              title={`Table ${table.label} · ${areaLabel(table.area)} · ${state}`}
              style={{
                left: `${table.pos_x}%`,
                top: `${table.pos_y}%`,
                width: `${table.width}%`,
                height: `${table.height}%`,
              }}
              className={cn(
                "absolute flex min-h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border text-[10px] font-medium leading-tight",
                table.shape === "round" ? "rounded-full" : "rounded-md",
                state === "booked"
                  ? "border-claret bg-claret/70 text-ivory"
                  : state === "inactive"
                    ? "border-line bg-raised/40 text-mute"
                    : "border-good/60 bg-good/10 text-ivory",
              )}
            >
              {table.label}
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mute" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-good/60 bg-good/10" /> Free
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-claret bg-claret/70" /> Booked
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-line bg-raised/40" /> Inactive
        </li>
      </ul>
    </div>
  );
}
