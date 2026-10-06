import { z } from "zod";

import { TABLE_AREAS } from "@/lib/constants/reservation";

export const TABLE_SHAPES = [
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "rectangle", label: "Rectangle" },
] as const;

const areaValues = TABLE_AREAS.map((a) => a.value) as [string, ...string[]];
const shapeValues = TABLE_SHAPES.map((s) => s.value) as [string, ...string[]];

const percent = (label: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `Enter a number for ${label}.` })
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} can’t be more than ${max}.`);

export const tableSchema = z
  .object({
    label: z.string().trim().min(1, "Give the table a label.").max(40, "Keep the label under 40 characters."),
    area: z.enum(areaValues, { errorMap: () => ({ message: "Choose an area." }) }),
    shape: z.enum(shapeValues, { errorMap: () => ({ message: "Choose a shape." }) }),
    minCapacity: z.coerce.number().int("Use a whole number.").min(1, "At least 1 guest.").max(50, "Keep this under 50."),
    capacity: z.coerce.number().int("Use a whole number.").min(1, "At least 1 guest.").max(50, "Keep this under 50."),
    posX: percent("Left position", 0, 100),
    posY: percent("Top position", 0, 100),
    width: percent("Width", 1, 100),
    height: percent("Height", 1, 100),
    notes: z
      .string()
      .trim()
      .max(300, "Keep the notes under 300 characters.")
      .transform((value) => (value === "" ? null : value)),
    isActive: z.boolean(),
  })
  .refine((data) => data.minCapacity <= data.capacity, {
    path: ["minCapacity"],
    message: "Minimum can’t be higher than the maximum capacity.",
  });

export type TableInput = z.infer<typeof tableSchema>;
