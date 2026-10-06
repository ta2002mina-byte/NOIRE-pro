import { z } from "zod";

/** Optional uuid field from a <select>: "" means "none". */
export const optionalId = z
  .union([z.literal(""), z.string().uuid()])
  .optional()
  .transform((value) => (value ? value : null));

/** datetime-local input ("YYYY-MM-DDTHH:mm") → ISO string, or null if left blank. */
export const optionalDatetimeLocal = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid date and time." });
      return z.NEVER;
    }
    return date.toISOString();
  });

/** Optional URL text field: "" means "none". */
export const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Enter a valid URL.")])
  .optional()
  .transform((value) => (value ? value : null));

/** "YYYY-MM-DDTHH:mm" (local) from an ISO timestamp, for a datetime-local input's defaultValue. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
