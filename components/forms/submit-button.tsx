"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  pendingLabel: string;
}

/** Disables itself and shows a spinner while the surrounding form's server action runs. */
export function SubmitButton({ children, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
