import { z } from "zod";

const optionalTrimmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

export const gallerySchema = z.object({
  imageUrl: z.string().trim().min(1, "Upload or paste an image URL.").url("Enter a valid URL."),
  altText: optionalTrimmed(200, "Keep the alt text under 200 characters."),
  caption: optionalTrimmed(200, "Keep the caption under 200 characters."),
  space: optionalTrimmed(80, "Keep the space name under 80 characters."),
  sortOrder: z.coerce.number().int("Use a whole number.").min(0, "0 or higher.").max(9999, "Keep this under 9999."),
  isActive: z.boolean(),
});

export type GalleryInput = z.infer<typeof gallerySchema>;
