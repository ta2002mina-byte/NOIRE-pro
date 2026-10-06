"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { initialFormState } from "@/lib/actions/state";
import { signInAction } from "@/lib/auth/actions";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, initialFormState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />

      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />

      <div className="space-y-2">
        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-mute underline-offset-4 hover:text-ivory hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      <SubmitButton size="lg" className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
