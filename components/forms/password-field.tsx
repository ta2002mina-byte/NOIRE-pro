"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { TextField, type TextFieldProps } from "@/components/forms/text-field";

export function PasswordField(props: Omit<TextFieldProps, "type" | "endAdornment">) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-mute transition-colors hover:text-ivory"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      }
    />
  );
}
