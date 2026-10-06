import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

export function SpiceLevel({ level, className }: { level: number; className?: string }) {
  if (!level || level <= 0) return null;
  const clamped = Math.min(5, Math.max(0, level));

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Spice level ${clamped} of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Flame
          key={i}
          aria-hidden="true"
          className={cn("h-3.5 w-3.5", i < clamped ? "fill-blush text-blush" : "text-line")}
        />
      ))}
    </span>
  );
}
