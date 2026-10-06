import { z } from "zod";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date as YYYY-MM-DD in UTC, used to stop future-dated journal entries. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export const journalEntrySchema = z.object({
  menuItemId: z
    .union([z.literal(""), z.string().uuid("Choose a dish from the list.")])
    .transform((value) => (value === "" ? null : value)),
  visitedAt: z
    .string()
    .regex(DATE_RE, "Choose a valid date.")
    .refine((value) => value <= todayUtc(), "The date can’t be in the future."),
  rating: z
    .union([z.literal(""), z.enum(["1", "2", "3", "4", "5"])])
    .transform((value) => (value === "" ? null : Number(value))),
  personalNote: z
    .string()
    .trim()
    .max(4000, "Keep notes under 4000 characters.")
    .transform((value) => (value === "" ? null : value)),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
