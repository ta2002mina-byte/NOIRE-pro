function shortDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

/** Vertical bars for reservation volume over time. Capped upstream to the most recent 30 buckets
 * (see lib/data/analytics.ts) so the chart stays legible regardless of the selected range. */
export function AnalyticsDailyChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-mute">No reservations in this period yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex h-32 items-end gap-1" role="img" aria-label="Reservation volume by day">
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div
              className="w-full rounded-t-sm bg-claret transition-colors group-hover:bg-claret-hover"
              style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-raised px-2 py-0.5 text-xs text-ivory group-hover:block">
              {shortDate(d.date)} · {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-mute">
        <span>{shortDate(data[0].date)}</span>
        <span>{shortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
