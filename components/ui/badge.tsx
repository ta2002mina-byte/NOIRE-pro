import { cn } from "@/lib/utils";

type Tone = "default" | "claret" | "outline";

const tones: Record<Tone, string> = {
  default: "bg-raised text-ivory",
  claret: "bg-claret/15 text-ivory",
  outline: "border border-line text-mute",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
