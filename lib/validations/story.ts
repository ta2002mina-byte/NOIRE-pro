import { z } from "zod";

import { optionalDatetimeLocal } from "@/lib/validations/shared";

export const STORY_TYPES = ["kitchen", "chef", "dish", "ingredient", "behind_the_scenes", "event"] as const;
export type StoryType = (typeof STORY_TYPES)[number];

export const storySchema = z
  .object({
    title: z.string().trim().min(2, "Give the story a title.").max(160, "Keep the title under 160 characters."),
    description: z
      .string()
      .trim()
      .max(2000, "Keep the description under 2000 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
    mediaUrl: z
      .union([z.literal(""), z.string().trim().url("Enter a valid image or video URL.")])
      .optional()
      .transform((value) => (value ? value : null)),
    storyType: z.enum(STORY_TYPES),
    publishedAt: optionalDatetimeLocal,
    expiresAt: optionalDatetimeLocal,
    isActive: z.boolean().default(true),
  })
  .refine((data) => !data.publishedAt || !data.expiresAt || new Date(data.expiresAt) > new Date(data.publishedAt), {
    message: "The expiry time must be after the publish time.",
    path: ["expiresAt"],
  });

export type StoryInput = z.infer<typeof storySchema>;
