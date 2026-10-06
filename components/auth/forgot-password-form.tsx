"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { initialFormState } from "@/lib/actions/state";
import { forgotPasswordAction } from "@/lib/auth/actions";

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useActionState(forgotPasswordAction, initialFormState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "idle" && initialError ? (
        <FormMessage state={{ status: "error", message: initialError }} />
      ) : (
        <FormMessage state={state} />
      )}

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

      <SubmitButton size="lg" className="w-full" pendingLabel="Sending link…">
        {state.status === "success" ? "Send another link" : "Send reset link"}
      </SubmitButton>
    </form>
  );
}
