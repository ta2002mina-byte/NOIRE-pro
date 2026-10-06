import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  name: string;
  label: string;
  error?: string[];
  hint?: string;
}

/** Label + textarea + hint/error, matching TextField's wiring and look. */
export function TextareaField({ name, label, error, hint, className, ...props }: TextareaFieldProps) {
  const id = React.useId();
  const message = error?.[0];
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = message ? errorId : hint ? hintId : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm text-ivory">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-invalid={message ? true : undefined}
        aria-describedby={describedBy}
        rows={4}
        className={cn(
          "w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-base text-ivory placeholder:text-mute/70 transition-colors",
          "hover:border-ivory/30 focus-visible:border-ivory/60 aria-[invalid=true]:border-danger md:text-sm",
          "disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {hint && !message ? (
        <p id={hintId} className="text-sm text-mute">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={errorId} className="text-sm text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
