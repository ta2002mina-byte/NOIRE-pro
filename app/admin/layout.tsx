import type { Metadata } from "next";

import { SectionShell } from "@/components/layout/section-shell";
import { requireAccess } from "@/lib/auth/session";
import { ADMIN_NAV } from "@/lib/constants/navigation";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin — NOIRÉ" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Non-staff get a 404 here, so the existence of the admin area isn't advertised.
  const ctx = await requireAccess("/admin");
  const navItems = ADMIN_NAV.filter((item) => !item.adminOnly || ctx.role === "admin");

  return (
    <SectionShell
      areaLabel="Admin"
      navItems={navItems}
      rootHref="/admin"
      displayName={ctx.profile?.full_name ?? ctx.user.email ?? "Signed in"}
      roleLabel={ctx.role}
      extraLink={{ href: "/account", label: "My account" }}
    >
      {children}
    </SectionShell>
  );
}
