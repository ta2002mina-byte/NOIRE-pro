import { z } from "zod";

export const CHEF_NOTE_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type ChefNoteStatus = (typeof CHEF_NOTE_STATUSES)[number];

/** Optional uuid field from a <select>: "" means "none". */
const optionalId = z
  .union([z.literal(""), z.string().uuid()])
  .optional()
  .transform((value) => (value ? value : null));

/** datetime-local input ("YYYY-MM-DDTHH:mm") → ISO string, or null if left blank. */
const optionalDatetimeLocal = z
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

export const chefNoteSchema = z
  .object({
    title: z.string().trim().min(2, "Give the note a title.").max(160, "Keep the title under 160 characters."),
    body: z.string().trim().min(10, "Write at least a sentence or two.").max(4000, "Keep the note under 4000 characters."),
    imageUrl: z
      .union([z.literal(""), z.string().trim().url("Enter a valid image URL.")])
      .optional()
      .transform((value) => (value ? value : null)),
    ingredientId: optionalId,
    isFeatured: z.boolean().default(false),
    status: z.enum(CHEF_NOTE_STATUSES),
    publishAt: optionalDatetimeLocal,
  })
  .refine((data) => data.status !== "scheduled" || data.publishAt !== null, {
    message: "Choose when this note should go live.",
    path: ["publishAt"],
  });

export type ChefNoteInput = z.infer<typeof chefNoteSchema>;
