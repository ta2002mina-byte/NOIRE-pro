import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark />
      <div className="space-y-3">
        <h1 className="text-4xl">This table doesn’t exist</h1>
        <p className="mx-auto max-w-sm text-mute">The page may have moved, or the link may be mistyped.</p>
      </div>
      <Link href="/" className={buttonStyles({ variant: "outline" })}>
        Back to the home page
      </Link>
    </main>
  );
}
