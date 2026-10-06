"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@/components/ui/button";

type SimpleResult = { ok: true } | { ok: false; message: string };

interface QuickActionButtonProps {
  label: string;
  action: () => Promise<SimpleResult>;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

/** A single button that calls a no-form server action and refreshes on success — the
 * "activate", "publish now", "mark as no-show" family of one-click admin actions. */
export function QuickActionButton({ label, action, variant = "outline", size = "sm", className }: QuickActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        loading={pending}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (result.ok) {
              router.refresh();
            } else {
              setError(result.message);
            }
          });
        }}
      >
        {label}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
