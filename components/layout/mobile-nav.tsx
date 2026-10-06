"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublicNavItem } from "@/lib/constants/navigation";

const HEADER_HEIGHT = "73px";

export function MobileNav({
  items,
  children,
}: {
  items: readonly PublicNavItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close after navigating.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        // Hand focus back to the button that opened the menu.
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ivory"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {/* `invisible` (visibility: hidden) removes the closed panel from the tab order and from
          screen readers, which opacity alone does not. `inert` is a second guard. */}
      <div
        id={panelId}
        inert={!open}
        style={{ top: HEADER_HEIGHT, height: `calc(100dvh - ${HEADER_HEIGHT})` }}
        className={cn(
          "fixed inset-x-0 z-40 overflow-y-auto bg-ink px-6 py-8 transition-[opacity,visibility] duration-200 motion-reduce:transition-none",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-3 text-lg text-ivory hover:bg-raised"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-8">{children}</div>
      </div>
    </div>
  );
}
