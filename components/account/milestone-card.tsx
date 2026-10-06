import { Check, Lock } from "lucide-react";

import { METRIC_LABELS } from "@/lib/constants/passport";
import type { MilestoneStatus } from "@/lib/data/passport";
import { formatDateOnly } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function MilestoneCard({ milestone }: { milestone: MilestoneStatus }) {
  return (
    <li
      className={cn(
        "rounded-2xl border p-5",
        milestone.earned ? "border-blush/40 bg-raised" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-ivory">{milestone.title}</p>
          <p className="mt-1 text-sm text-mute">{milestone.description}</p>
        </div>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            milestone.earned ? "bg-blush/15 text-blush" : "bg-line/40 text-mute",
          )}
          aria-hidden="true"
        >
          {milestone.earned ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </span>
      </div>

      {milestone.earned ? (
        <p className="mt-4 text-xs uppercase tracking-[0.08em] text-mute">
          Earned {formatDateOnly(milestone.awardedAt.slice(0, 10))}
        </p>
      ) : (
        <div className="mt-4 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/40">
            <div
              className="h-full rounded-full bg-blush"
              style={{ width: `${Math.min(100, Math.round((milestone.progress / milestone.threshold) * 100))}%` }}
            />
          </div>
          <p className="text-xs text-mute">
            {Math.min(milestone.progress, milestone.threshold)} of {milestone.threshold} {METRIC_LABELS[milestone.metric]}
            {milestone.secondaryMetric && milestone.secondaryThreshold ? (
              <>
                {" "}
                &middot; {Math.min(milestone.secondaryProgress ?? 0, milestone.secondaryThreshold)} of{" "}
                {milestone.secondaryThreshold} {METRIC_LABELS[milestone.secondaryMetric]}
              </>
            ) : null}
          </p>
        </div>
      )}
    </li>
  );
}
