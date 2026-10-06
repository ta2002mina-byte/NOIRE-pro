import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormMessage } from "@/components/forms/form-message";
import { buttonStyles } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The emailed link signs the user in (via /auth/callback) before they land here.
  const ctx = await getAuthContext();

  if (!ctx) {
    return (
      <AuthCard title="This link can’t be used" description="Reset links expire and only work once.">
        <div className="space-y-5">
          <FormMessage
            state={{
              status: "error",
              message: "We couldn’t verify your reset link. Request a new one and open it in the same browser you asked from.",
            }}
          />
          <Link href="/forgot-password" className={buttonStyles({ size: "lg", className: "w-full" })}>
            Request a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" description="Pick something you haven’t used with NOIRÉ before.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
