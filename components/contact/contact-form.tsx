"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { submitContactMessageAction } from "@/lib/actions/contact";
import { initialFormState } from "@/lib/actions/state";

interface ContactFormProps {
  /** Pre-fills name and email for a signed-in guest. */
  defaultName?: string;
  defaultEmail?: string;
}

export function ContactForm({ defaultName = "", defaultEmail = "" }: ContactFormProps) {
  const [state, formAction] = useActionState(submitContactMessageAction, initialFormState);
  const v = state.values;
  const err = state.fieldErrors;
  const sent = state.status === "success";

  if (sent) {
    return <FormMessage state={state} />;
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="Your name"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={v?.name ?? defaultName}
          error={err?.name}
        />
        <TextField
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={v?.email ?? defaultEmail}
          error={err?.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="phone"
          type="tel"
          label="Phone (optional)"
          autoComplete="tel"
          maxLength={40}
          defaultValue={v?.phone ?? ""}
          error={err?.phone}
        />
        <TextField name="subject" label="Subject (optional)" maxLength={150} defaultValue={v?.subject ?? ""} error={err?.subject} />
      </div>

      <TextareaField
        name="message"
        label="Message"
        rows={6}
        required
        maxLength={4000}
        defaultValue={v?.message ?? ""}
        error={err?.message}
      />

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <p className="text-xs text-mute">
        We use your details only to reply to you. See our{" "}
        <a href="/privacy" className="underline hover:text-ivory">
          Privacy Policy
        </a>
        .
      </p>

      <SubmitButton size="lg" pendingLabel="Sending…">
        Send message
      </SubmitButton>
    </form>
  );
}
