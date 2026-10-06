import { z } from "zod";

import { TABLE_AREAS } from "@/lib/constants/reservation";
import { SLUG_RE } from "@/lib/utils/slug";

const areaValues = TABLE_AREAS.map((a) => a.value) as [string, ...string[]];

/** Empty string from an optional number input becomes undefined, not NaN. */
const optionalGuestCount = z
  .union([z.literal(""), z.coerce.number().int().min(1).max(100)])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

export const experienceSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Give the experience a title.")
      .max(120, "Keep the title under 120 characters."),
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
    minGuests: optionalGuestCount,
    maxGuests: optionalGuestCount,
    availableAreas: z.array(z.enum(areaValues)).max(TABLE_AREAS.length).default([]),
    preparationNotes: z
      .string()
      .trim()
      .max(600, "Keep preparation notes under 600 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.minGuests === null || data.maxGuests === null || data.minGuests <= data.maxGuests, {
    message: "Minimum guests can’t be more than maximum guests.",
    path: ["maxGuests"],
  });

export type ExperienceInput = z.infer<typeof experienceSchema>;
