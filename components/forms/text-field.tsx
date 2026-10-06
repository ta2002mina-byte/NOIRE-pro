import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  name: string;
  label: string;
  /** Messages from the server-side validation of this field. */
  error?: string[];
  hint?: string;
  endAdornment?: React.ReactNode;
}

/** Label + input + hint/error, wired together with the right ARIA attributes. */
export function TextField({ name, label, error, hint, endAdornment, className, ...props }: TextFieldProps) {
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
      <div className="relative">
        <input
          id={id}
          name={name}
          aria-invalid={message ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ivory placeholder:text-mute/70 transition-colors",
            "hover:border-ivory/30 focus-visible:border-ivory/60 aria-[invalid=true]:border-danger md:text-sm",
            "read-only:text-mute disabled:opacity-50",
            endAdornment && "pr-12",
            className,
          )}
          {...props}
        />
        {endAdornment ? <div className="absolute inset-y-0 right-1 flex items-center">{endAdornment}</div> : null}
      </div>
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
