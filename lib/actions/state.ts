import type { ZodError } from "zod";

/** What a form's server action hands back to the form. Never contains passwords. */
export type FieldErrors = Record<string, string[] | undefined>;

export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
  /** Non-sensitive values echoed back so the form can refill itself after an error. */
  values?: Record<string, string>;
}

export const initialFormState: FormState = { status: "idle" };

export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function toFieldErrors(error: ZodError): FieldErrors {
  return error.flatten().fieldErrors;
}
