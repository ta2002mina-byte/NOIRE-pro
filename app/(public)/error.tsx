"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** A failure inside a public page keeps the header and footer; only the page area is replaced. */
export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public] Unhandled error:", error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
      <h1 className="text-3xl sm:text-4xl">This page didn’t load</h1>
      <p className="text-mute">It’s on our side. Try again in a moment, or head back to the menu.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
