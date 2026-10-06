import { z } from "zod";

export const CONTACT_STATUSES = ["new", "read", "replied", "archived"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === "string" && (CONTACT_STATUSES as readonly string[]).includes(value);
}

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

/** The public Contact form. */
export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(100, "That name is too long."),
  email: z.string().trim().min(1, "Please enter your email.").max(254, "That email is too long.").email("Enter a valid email address."),
  phone: optionalText(40, "That phone number is too long."),
  subject: optionalText(150, "Keep the subject under 150 characters."),
  message: z
    .string()
    .trim()
    .min(5, "Please write a little more.")
    .max(4000, "Keep your message under 4,000 characters."),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
