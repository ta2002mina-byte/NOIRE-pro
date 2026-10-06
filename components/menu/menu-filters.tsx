"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DIET_FILTERS, MOOD_FILTERS, SORT_OPTIONS, SPICE_FILTERS } from "@/lib/constants/menu-filters";

const selectStyles =
  "h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ivory transition-colors hover:border-ivory/30 focus-visible:border-ivory/60 focus-visible:outline-none";

export function MenuFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mood = searchParams.get("mood") ?? "";
  const diet = searchParams.get("diet") ?? "";
  const spice = searchParams.get("spice") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const q = searchParams.get("q") ?? "";

  const [searchValue, setSearchValue] = React.useState(q);

  // Keep the input in sync if the URL changes from elsewhere (e.g. a mood chip reset).
  React.useEffect(() => {
    setSearchValue(q);
  }, [q]);

  const updateParams = React.useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounce the search box so every keystroke doesn't trigger a navigation.
  React.useEffect(() => {
    if (searchValue === q) return;
    const handle = setTimeout(() => updateParams({ q: searchValue }), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const hasActiveFilters = Boolean(mood || diet || spice || sort || q);

  function clearAll() {
    setSearchValue("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="menu-search" className="block text-sm text-ivory">
            Search dishes
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
            />
            <input
              id="menu-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by name or description"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-sm text-ivory placeholder:text-mute/70 transition-colors hover:border-ivory/30 focus-visible:border-ivory/60 focus-visible:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="menu-diet" className="sr-only">
              Dietary preference
            </label>
            <select
              id="menu-diet"
              value={diet}
              onChange={(event) => updateParams({ diet: event.target.value })}
              className={selectStyles}
            >
              <option value="">Any diet</option>
              {DIET_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="menu-spice" className="sr-only">
              Maximum spice level
            </label>
            <select
              id="menu-spice"
              value={spice}
              onChange={(event) => updateParams({ spice: event.target.value })}
              className={selectStyles}
            >
              <option value="">Any spice</option>
              {SPICE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="menu-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="menu-sort"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className={selectStyles}
            >
              <option value="">Chef&rsquo;s order</option>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by mood">
        {MOOD_FILTERS.map((option) => {
          const active = mood === option.slug;
          return (
            <button
              key={option.slug}
              type="button"
              aria-pressed={active}
              onClick={() => updateParams({ mood: active ? "" : option.slug })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                active
                  ? "border-claret bg-claret/15 text-ivory"
                  : "border-line text-mute hover:border-ivory/40 hover:text-ivory",
              )}
            >
              {option.label}
            </button>
          );
        })}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-mute transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
