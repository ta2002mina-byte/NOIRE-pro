import Link from "next/link";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  /** Plural noun for the count, e.g. "customers", "reservations". */
  itemLabel: string;
  /** Route the pagination links point at, e.g. "/admin/customers". */
  basePath: string;
  /** Other query params to preserve across page links (filters, search). Empty-string values are dropped. */
  params?: Record<string, string>;
}

/** Prev/Next pager for admin list pages. Renders nothing when everything fits on one page. */
export function Pagination({ page, totalPages, total, itemLabel, basePath, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value) query[key] = value;
    }
    query.page = String(target);
    return `${basePath}?${new URLSearchParams(query)}`;
  }

  return (
    <nav className="flex items-center justify-between text-sm text-mute" aria-label="Pagination">
      <span>
        Page {page} of {totalPages} · {total} {itemLabel}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="rounded-full border border-line px-4 py-2 text-ivory hover:border-ivory/60">
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className="rounded-full border border-line px-4 py-2 text-ivory hover:border-ivory/60">
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
