import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard, authLinkClass } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getDefaultLandingPath } from "@/lib/auth/access";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage() {
  const ctx = await getAuthContext();
  if (ctx) redirect(getDefaultLandingPath(ctx.role));

  return (
    <AuthCard
      title="Create your account"
      description="Reserve a table and keep a record of what you’ve loved."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
