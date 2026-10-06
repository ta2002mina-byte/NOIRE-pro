import type { Metadata } from "next";

import { SectionShell } from "@/components/layout/section-shell";
import { requireAccess } from "@/lib/auth/session";
import { ACCOUNT_NAV } from "@/lib/constants/navigation";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s — My account — NOIRÉ" },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAccess("/account");
  const isStaff = ctx.role === "staff" || ctx.role === "admin";

  return (
    <SectionShell
      areaLabel="My account"
      navItems={ACCOUNT_NAV}
      rootHref="/account"
      displayName={ctx.profile?.full_name ?? ctx.user.email ?? "Signed in"}
      extraLink={isStaff ? { href: "/admin", label: "Admin" } : undefined}
    >
      {children}
    </SectionShell>
  );
}
