"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/actions/state";
import { changePasswordAction } from "@/lib/account/actions";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialFormState);

  return (
    <form action={formAction} noValidate className="max-w-md space-y-5">
      <FormMessage state={state} />
      <PasswordField
        name="currentPassword"
        label="Current password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
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
      <SubmitButton pendingLabel="Updating password…">Update password</SubmitButton>
    </form>
  );
}
