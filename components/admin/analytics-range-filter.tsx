import Link from "next/link";

import { cn } from "@/lib/utils";
import { ANALYTICS_RANGES, type AnalyticsRangeValue } from "@/lib/constants/analytics";

/** Plain links, not client state — the range lives in the URL so it survives a refresh or a share,
 * same pattern as the reservation filters (components/admin/reservation-filters.tsx). */
export function AnalyticsRangeFilter({ active }: { active: AnalyticsRangeValue }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
      {ANALYTICS_RANGES.map((r) => (
        <Link
          key={r.value}
          href={`/admin/analytics?range=${r.value}`}
          aria-current={r.value === active ? "true" : undefined}
          className={cn(
            "h-9 rounded-full border px-4 text-sm leading-9 transition-colors",
            r.value === active
              ? "border-ivory bg-raised text-ivory"
              : "border-line text-mute hover:border-ivory/40 hover:text-ivory",
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
