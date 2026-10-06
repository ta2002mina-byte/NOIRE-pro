import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard, authLinkClass } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { FormMessage } from "@/components/forms/form-message";
import { getSafeRedirectPath, resolvePostLoginPath } from "@/lib/auth/access";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

interface SignInPageProps {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, reason, error } = await searchParams;

  const ctx = await getAuthContext();
  if (ctx) redirect(resolvePostLoginPath(ctx.role, next));

  const notice =
    reason === "expired"
      ? "Your session ended. Sign in to continue."
      : error === "auth_callback"
        ? "That link has expired or was already used. Sign in, or request a new one."
        : null;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your reservations and your dining story."
      footer={
        <>
          New to NOIRÉ?{" "}
          <Link href="/signup" className={authLinkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {notice ? <FormMessage state={{ status: "error", message: notice }} /> : null}
        <SignInForm next={getSafeRedirectPath(next) ?? ""} />
      </div>
    </AuthCard>
  );
}
