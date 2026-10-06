"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/actions/state";
import { resetPasswordAction } from "@/lib/auth/actions";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialFormState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage state={state} />
      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        required
        hint="Use at least 8 characters."
        error={state.fieldErrors?.password}
      />
      <PasswordField
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton size="lg" className="w-full" pendingLabel="Updating password…">
        Update password
      </SubmitButton>
    </form>
  );
}
