"use client";

import { useActionState } from "react";

import { ImageUploadField } from "@/components/admin/image-upload-field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { initialFormState } from "@/lib/actions/state";
import { updateProfileAction } from "@/lib/account/actions";

interface ProfileFormProps {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string;
}

export function ProfileForm({ userId, fullName, phone, email, avatarUrl }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialFormState);

  return (
    <form action={formAction} noValidate className="max-w-md space-y-5">
      <FormMessage state={state} />

      {/* Folder is scoped to this user's own id — storage RLS (see the Phase 16
          migration) only lets a signed-in customer write under their own avatars/<uid>/ path. */}
      <ImageUploadField
        name="avatarUrl"
        label="Profile photo"
        folder={`avatars/${userId}`}
        defaultValue={state.values?.avatarUrl ?? avatarUrl}
        hint="Shown on your account. Leave blank for none."
        error={state.fieldErrors?.avatarUrl}
      />

      <TextField
        name="fullName"
        label="Full name"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName ?? fullName}
        error={state.fieldErrors?.fullName}
      />
      <TextField
        name="phone"
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        defaultValue={state.values?.phone ?? phone}
        hint="Only used for your reservations."
        error={state.fieldErrors?.phone}
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        value={email}
        readOnly
        aria-readonly="true"
        hint="Your email is used to sign in and can’t be changed here."
      />
      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}
