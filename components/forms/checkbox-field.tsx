import * as React from "react";

import { cn } from "@/lib/utils";

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  wrapperClassName?: string;
}

/** A single labeled checkbox, styled to match TextField/TextareaField. */
export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  { label, wrapperClassName, className, ...props },
  ref,
) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ivory", wrapperClassName)}>
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 shrink-0 rounded border-line bg-surface text-claret accent-claret focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
});
