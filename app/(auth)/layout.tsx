import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";

// Sign-in/sign-up/password-reset pages: nothing here is content worth ranking,
// and indexing them invites credential-stuffing bots more than real visitors.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-6 sm:px-10">
        <Link href="/" aria-label="NOIRÉ, home">
          <Wordmark />
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-6 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-6 pb-8 text-center text-sm text-mute">Your table. Your taste. Your story.</footer>
    </div>
  );
}
