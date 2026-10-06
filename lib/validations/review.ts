import { z } from "zod";

export const RATING_VALUES = ["1", "2", "3", "4", "5"] as const;

export const reviewSchema = z.object({
  menuItemId: z
    .union([z.literal(""), z.string().uuid("Choose a dish from the list.")])
    .transform((value) => (value === "" ? null : value)),
  rating: z.enum(RATING_VALUES, { errorMap: () => ({ message: "Choose a rating." }) }).transform((value) => Number(value)),
  title: z
    .string()
    .trim()
    .max(200, "Keep the title under 200 characters.")
    .transform((value) => (value === "" ? null : value)),
  body: z
    .string()
    .trim()
    .max(4000, "Keep the review under 4000 characters.")
    .transform((value) => (value === "" ? null : value)),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const REVIEW_STATUSES = ["pending", "published", "hidden"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}
