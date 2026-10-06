import * as React from "react";

import { cn } from "@/lib/utils";

export interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  name: string;
  label: string;
  error?: string[];
  hint?: string;
}

/** Label + select + hint/error, matching TextField's wiring and look. */
export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { name, label, error, hint, className, children, ...props },
  ref,
) {
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
      <select
        ref={ref}
        id={id}
        name={name}
        aria-invalid={message ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ivory transition-colors",
          "hover:border-ivory/30 focus-visible:border-ivory/60 aria-[invalid=true]:border-danger md:text-sm",
          "disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
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
});
