import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard, authLinkClass } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reset your password" };

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  // Signed in already? Changing the password lives in account settings.
  const ctx = await getAuthContext();
  if (ctx) redirect("/account/settings");

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we’ll send you a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/signin" className={authLinkClass}>
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm
        initialError={error === "auth_callback" ? "That reset link has expired or was already used. Request a new one below." : undefined}
      />
    </AuthCard>
  );
}
