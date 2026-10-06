"use client";

import { areaLabel } from "@/lib/constants/reservation";
import { cn } from "@/lib/utils";
import type { AvailableTable } from "@/lib/actions/reservation";

export function TableMap({
  tables,
  selectedId,
  onSelect,
}: {
  tables: AvailableTable[];
  selectedId: string | null;
  onSelect: (tableId: string) => void;
}) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_top,_theme(colors.raised),_theme(colors.surface))] sm:aspect-[16/9]"
      role="group"
      aria-label="Restaurant floor plan"
    >
      {tables.map((table) => {
        const selected = table.id === selectedId;
        const status = selected ? "Selected" : table.available ? "Available" : "Reserved";

        return (
          <button
            key={table.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Table ${table.label}, ${areaLabel(table.area)}, seats ${table.min_capacity} to ${table.capacity}. ${status}.`}
            disabled={!table.available && !selected}
            onClick={() => onSelect(table.id)}
            style={{
              left: `${table.pos_x}%`,
              top: `${table.pos_y}%`,
              width: `${table.width}%`,
              height: `${table.height}%`,
            }}
            className={cn(
              "absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 border text-[11px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              table.shape === "round" ? "rounded-full" : "rounded-md",
              selected
                ? "border-claret bg-claret text-ivory shadow-lg"
                : table.available
                  ? "border-good/60 bg-good/10 text-ivory hover:border-good hover:bg-good/20"
                  : "cursor-not-allowed border-line bg-raised/60 text-mute line-through decoration-mute/60",
            )}
          >
            <span>{table.label}</span>
            <span className="text-[10px] opacity-80">{table.capacity}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TableMapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-mute" aria-hidden="true">
      <li className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border border-good/60 bg-good/10" /> Available
      </li>
      <li className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border border-claret bg-claret" /> Selected
      </li>
      <li className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border border-line bg-raised/60" /> Reserved
      </li>
    </ul>
  );
}

/** Accessible, screen-reader-friendly fallback list mirroring the map — the
 * same buttons in list form, grouped by area, for anyone who’d rather not
 * navigate a spatial layout (keyboard users, screen readers, small screens). */
export function TableList({
  tables,
  selectedId,
  onSelect,
}: {
  tables: AvailableTable[];
  selectedId: string | null;
  onSelect: (tableId: string) => void;
}) {
  const byArea = new Map<string, AvailableTable[]>();
  for (const table of tables) {
    const list = byArea.get(table.area) ?? [];
    list.push(table);
    byArea.set(table.area, list);
  }

  return (
    <div className="space-y-5" role="radiogroup" aria-label="Tables, listed by area">
      {[...byArea.entries()].map(([area, areaTables]) => (
        <div key={area}>
          <p className="text-xs uppercase tracking-[0.2em] text-mute">{areaLabel(area)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {areaTables.map((table) => {
              const selected = table.id === selectedId;
              return (
                <button
                  key={table.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!table.available && !selected}
                  onClick={() => onSelect(table.id)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                    selected
                      ? "border-claret bg-claret/15 text-ivory"
                      : table.available
                        ? "border-line text-ivory hover:border-ivory/40"
                        : "cursor-not-allowed border-line text-mute line-through decoration-mute/60",
                  )}
                >
                  <span className="block font-medium">Table {table.label}</span>
                  <span className="block text-xs text-mute">
                    Seats {table.min_capacity}–{table.capacity} · {table.available ? "Available" : "Reserved"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
