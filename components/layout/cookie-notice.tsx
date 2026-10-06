"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "noire-cookie-notice-v1";

/**
 * A small, non-blocking notice. NOIRÉ sets only essential sign-in cookies (no tracking or
 * ads), so this informs rather than asks for consent. The choice is remembered on this device;
 * if storage is unavailable the notice simply shows again on the next visit.
 */
export function CookieNotice() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage blocked — hide for this visit only */
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-raised p-4 shadow-xl sm:flex sm:items-center sm:gap-4"
    >
      <p className="text-sm text-mute">
        We only use essential cookies to keep you signed in — no ads or tracking.{" "}
        <Link href="/cookies" className="text-ivory underline">
          Learn more
        </Link>
      </p>
      <Button type="button" size="sm" className="mt-3 w-full shrink-0 sm:mt-0 sm:w-auto" onClick={dismiss}>
        Got it
      </Button>
    </div>
  );
}
