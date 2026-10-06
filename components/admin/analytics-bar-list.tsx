/** A simple horizontal bar list for count breakdowns (moods, occasions, popular dishes…).
 * No charting library is in the project's dependencies, so bars are plain divs sized by
 * percentage of the top value — legible, responsive, and needs no client JS. */
export function AnalyticsBarList({
  rows,
  emptyLabel,
}: {
  rows: { label: string; count: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-mute">{emptyLabel}</p>;
  }

  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ivory">{row.label}</span>
            <span className="shrink-0 text-mute">{row.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-claret"
              style={{ width: `${Math.max((row.count / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
