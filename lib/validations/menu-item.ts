import { z } from "zod";

import { DIET_FILTERS } from "@/lib/constants/menu-filters";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";
import { optionalId, optionalUrl } from "@/lib/validations/shared";

const dietValues = DIET_FILTERS.map((d) => d.value) as [string, ...string[]];
const moodValues = MOOD_FILTERS.map((m) => m.value) as [string, ...string[]];

/** Empty string from an optional number input becomes undefined, not NaN. */
function optionalNumber(min: number, max: number) {
  return z
    .union([z.literal(""), z.coerce.number().min(min).max(max)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value));
}

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, "Give the dish a name.").max(160, "Keep the name under 160 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.")
    .max(80, "Keep the slug under 80 characters."),
  categoryId: optionalId,
  description: z
    .string()
    .trim()
    .max(600, "Keep the description under 600 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  story: z
    .string()
    .trim()
    .max(2000, "Keep the story under 2000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  chefNote: z
    .string()
    .trim()
    .max(1000, "Keep the chef's note under 1000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  price: z.coerce.number().min(0, "Price can’t be negative.").max(10000, "That price looks too high — check it."),
  imageUrl: optionalUrl,
  spiceLevel: z.coerce.number().int().min(0).max(5).default(0),
  dietType: z
    .union([z.literal(""), z.enum(dietValues)])
    .optional()
    .transform((value) => (value ? value : null)),
  dietaryTags: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    ),
  caloriesKcal: optionalNumber(0, 20000),
  proteinG: optionalNumber(0, 2000),
  carbsG: optionalNumber(0, 2000),
  fatG: optionalNumber(0, 2000),
  isFeatured: z.boolean().default(false),
  isChefChoice: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

/** "Recommendation attributes" — a single row in dish_preferences per dish, kept
 * simple: the schema allows several rows per dish, but one covers most cases and
 * keeps the form a single fieldset instead of a repeating list. */
export const dishPreferenceSchema = z.object({
  mood: z
    .union([z.literal(""), z.enum(moodValues)])
    .optional()
    .transform((value) => (value ? value : null)),
  flavor: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  texture: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  mealType: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  occasion: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  spiceLevel: optionalNumber(0, 5),
});

export type DishPreferenceInput = z.infer<typeof dishPreferenceSchema>;
