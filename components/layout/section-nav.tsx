"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SectionNavItem } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

interface SectionNavProps {
  label: string;
  items: readonly SectionNavItem[];
  /** The overview link. It is only "current" on an exact match. */
  rootHref: string;
}

/** Side navigation on large screens; a horizontally scrolling strip on small ones. */
export function SectionNav({ label, items, rootHref }: SectionNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => {
          const current =
            item.href === rootHref ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors lg:rounded-xl",
                  current ? "bg-raised text-ivory" : "text-mute hover:bg-surface hover:text-ivory",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
