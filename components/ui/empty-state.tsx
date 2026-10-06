import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-line px-6 py-12 text-center sm:px-12", className)}>
      <p className="font-display text-2xl text-ivory">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-mute">{description}</p>
      {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
    </div>
  );
}
