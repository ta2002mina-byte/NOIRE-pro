import { Skeleton } from "@/components/ui/skeleton";

export default function DishLoading() {
  return (
    <div role="status" aria-label="Loading dish" className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <Skeleton className="h-4 w-24" />
      <div className="mt-8 grid gap-10 sm:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <Skeleton className="mt-4 h-6 w-24" />
          <Skeleton className="mt-6 h-20 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
