import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/account/change-password-form";
import { requireAccess } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function AccountSettingsPage() {
  await requireAccess("/account/settings");

  return (
    <div className="space-y-10">
      <h1 className="text-3xl sm:text-4xl">Settings</h1>
      <section aria-labelledby="password-heading" className="space-y-6">
        <div className="space-y-2">
          <h2 id="password-heading" className="text-2xl">
            Password
          </h2>
          <p className="max-w-prose text-mute">Changing it signs you out of your other devices.</p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
