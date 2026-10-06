import Link from "next/link";
import { BookOpen, Stamp } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

export function JournalPassportSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line p-8">
            <BookOpen className="h-6 w-6 text-blush" aria-hidden="true" />
            <p className="mt-4 text-2xl text-ivory">Dining Journal</p>
            <p className="mt-2 text-mute">Keep a personal record of every dish you try, with your own notes and ratings.</p>
            <Link
              href={signedIn ? "/account/journal" : "/signup"}
              className={buttonStyles({ variant: "outline", className: "mt-6" })}
            >
              {signedIn ? "Open your journal" : "Create an account"}
            </Link>
          </div>
          <div className="rounded-2xl border border-line p-8">
            <Stamp className="h-6 w-6 text-blush" aria-hidden="true" />
            <p className="mt-4 text-2xl text-ivory">Dining Passport</p>
            <p className="mt-2 text-mute">Earn milestones for the visits, dishes and experiences you explore at NOIRÉ.</p>
            <Link
              href={signedIn ? "/account/passport" : "/signup"}
              className={buttonStyles({ variant: "outline", className: "mt-6" })}
            >
              {signedIn ? "View your passport" : "Create an account"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
