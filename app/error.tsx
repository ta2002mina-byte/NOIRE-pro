"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] Unhandled error:", error);
  }, [error]);

  return (
    <main role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl">Something went wrong</h1>
      <p className="max-w-sm text-mute">It’s on our side, and nothing you entered was lost. Try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
