import { Skeleton } from "@/components/ui/skeleton";

/** Shown inside the public frame (header and footer stay put) while a page's data loads. */
export default function PublicLoading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-10 w-64 max-w-full" />
      <Skeleton className="mt-4 h-4 w-full max-w-md" />
      <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="mt-4 h-5 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
