"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { initialFormState } from "@/lib/actions/state";
import { signUpAction } from "@/lib/auth/actions";

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialFormState);

  if (state.status === "success") {
    return <FormMessage state={state} />;
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage state={state} />

      <TextField
        name="fullName"
        label="Full name"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        error={state.fieldErrors?.fullName}
      />
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
      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        required
        hint="Use at least 8 characters."
        error={state.fieldErrors?.password}
      />
      <PasswordField
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton size="lg" className="w-full" pendingLabel="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
