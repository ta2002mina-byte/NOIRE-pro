import { z } from "zod";

import { SLUG_RE } from "@/lib/utils/slug";

export const ingredientSchema = z.object({
  name: z.string().trim().min(2, "Give the ingredient a name.").max(120, "Keep the name under 120 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_RE, "Use lowercase letters, numbers and hyphens only.")
    .max(80, "Keep the slug under 80 characters."),
  description: z
    .string()
    .trim()
    .max(600, "Keep the description under 600 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  imageUrl: z
    .union([z.literal(""), z.string().trim().url("Enter a valid image URL.")])
    .optional()
    .transform((value) => (value ? value : null)),
  season: z
    .string()
    .trim()
    .max(120, "Keep this under 120 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  isActive: z.boolean().default(true),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
