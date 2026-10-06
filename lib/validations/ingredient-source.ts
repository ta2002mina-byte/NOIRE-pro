import { z } from "zod";

export const SOURCE_TYPES = ["farm", "supplier", "market", "foraged", "in_house", "other"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

const optionalMonth = z
  .union([z.literal(""), z.coerce.number().int().min(1).max(12)])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

const optionalSourceType = z
  .union([z.literal(""), z.enum(SOURCE_TYPES)])
  .optional()
  .transform((value) => (value ? value : null));

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const optionalDate = z
  .union([z.literal(""), z.string().date()])
  .optional()
  .transform((value) => (value ? value : null));

// A season can wrap the new year (e.g. start 11, end 2), so start/end aren't
// cross-validated against each other — any combination of two valid months is fine.
export const ingredientSourceSchema = z.object({
  sourceName: z
    .string()
    .trim()
    .min(2, "Name the source — a farm, supplier or market.")
    .max(160, "Keep this under 160 characters."),
  sourceType: optionalSourceType,
  location: optionalText(160, "Keep the location under 160 characters."),
  seasonStartMonth: optionalMonth,
  seasonEndMonth: optionalMonth,
  harvestDate: optionalDate,
  notes: optionalText(600, "Keep notes under 600 characters."),
  isPublished: z.boolean().default(false),
});

export type IngredientSourceInput = z.infer<typeof ingredientSourceSchema>;
