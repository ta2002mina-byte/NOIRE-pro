import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-claret text-ivory hover:bg-claret-hover",
  outline: "border border-line text-ivory hover:border-ivory/60 hover:bg-raised",
  ghost: "text-mute hover:text-ivory",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-11 px-6",
  lg: "h-12 px-8 text-base",
};

interface StyleOptions {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** Class names for a button look. Also used on <Link> elements. */
export function buttonStyles({ variant = "primary", size = "md", className }: StyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, StyleOptions {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
