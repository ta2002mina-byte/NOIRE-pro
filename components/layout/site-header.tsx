import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Wordmark } from "@/components/brand/wordmark";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buttonStyles } from "@/components/ui/button";
import { PUBLIC_NAV } from "@/lib/constants/navigation";
import { getDefaultLandingPath } from "@/lib/auth/access";
import { getAuthContext } from "@/lib/auth/session";

/** Public-site header: wordmark, primary nav, account/auth links, and a mobile drawer. */
export async function SiteHeader() {
  const ctx = await getAuthContext();

  const authSection = ctx ? (
    <>
      <Link href={getDefaultLandingPath(ctx.role)} className={buttonStyles({ variant: "outline", size: "sm" })}>
        {ctx.role === "customer" ? "My account" : "Admin"}
      </Link>
      <SignOutButton />
    </>
  ) : (
    <>
      <Link href="/signin" className={buttonStyles({ variant: "ghost", size: "sm" })}>
        Sign in
      </Link>
      <Link href="/signup" className={buttonStyles({ variant: "outline", size: "sm" })}>
        Create account
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-[73px] w-full max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="NOIRÉ, home" className="shrink-0">
          <Wordmark className="text-xl" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-6">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-mute transition-colors hover:text-ivory"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/reserve" className={buttonStyles({ size: "sm" })}>
            Reserve
          </Link>
          {authSection}
        </div>

        <MobileNav items={PUBLIC_NAV}>
          <Link href="/reserve" className={buttonStyles({ size: "lg" })}>
            Reserve a table
          </Link>
          {authSection}
        </MobileNav>
      </div>
    </header>
  );
}
