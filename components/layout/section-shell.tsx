import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Wordmark } from "@/components/brand/wordmark";
import { SectionNav } from "@/components/layout/section-nav";
import type { SectionNavItem } from "@/lib/constants/navigation";

interface SectionShellProps {
  areaLabel: string;
  navItems: readonly SectionNavItem[];
  rootHref: string;
  displayName: string;
  roleLabel?: string;
  extraLink?: { href: string; label: string };
  children: React.ReactNode;
}

/** The frame shared by the customer account area and the admin area. */
export function SectionShell({
  areaLabel,
  navItems,
  rootHref,
  displayName,
  roleLabel,
  extraLink,
  children,
}: SectionShellProps) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only rounded-full bg-ivory px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>

      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="NOIRÉ, back to the home page">
              <Wordmark className="text-xl" />
            </Link>
            <span className="hidden text-sm text-mute sm:inline">{areaLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[16rem] truncate text-sm text-mute md:inline">
              {displayName}
              {roleLabel ? <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-xs">{roleLabel}</span> : null}
            </span>
            {extraLink ? (
              <Link href={extraLink.href} className="text-sm text-mute underline-offset-4 hover:text-ivory hover:underline">
                {extraLink.label}
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl gap-10 px-6 py-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:py-12">
        <div className="mb-8 lg:mb-0">
          <SectionNav label={areaLabel} items={navItems} rootHref={rootHref} />
        </div>
        <main id="main" tabIndex={-1} className="min-w-0 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
