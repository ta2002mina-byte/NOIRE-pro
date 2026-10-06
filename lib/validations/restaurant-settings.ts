import { z } from "zod";

export const OPENING_HOURS_DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export type OpeningHoursDayKey = (typeof OPENING_HOURS_DAYS)[number]["key"];

/** "" for a day input means closed / unset — not stored. Otherwise the free-text
 * value (e.g. "18:00–23:00") is kept as-is; the kitchen decides the format. */
const dayHoursField = z
  .string()
  .trim()
  .max(60, "Keep this under 60 characters.")
  .transform((value) => (value === "" ? null : value));

const optionalTrimmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

const optionalCoordinate = (min: number, max: number, message: string) =>
  z
    .union([z.literal(""), z.coerce.number().min(min).max(max, message)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value));

export const restaurantSettingsSchema = z.object({
  name: z.string().trim().min(1, "Give the restaurant a name.").max(160, "Keep the name under 160 characters."),
  tagline: optionalTrimmed(200, "Keep the tagline under 200 characters."),
  description: optionalTrimmed(2000, "Keep the description under 2000 characters."),
  addressLine: optionalTrimmed(200, "Keep the address under 200 characters."),
  city: optionalTrimmed(100, "Keep the city under 100 characters."),
  region: optionalTrimmed(100, "Keep the region under 100 characters."),
  postalCode: optionalTrimmed(20, "Keep the postal code under 20 characters."),
  country: optionalTrimmed(100, "Keep the country under 100 characters."),
  phone: optionalTrimmed(40, "Keep the phone number under 40 characters."),
  email: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email address.")])
    .optional()
    .transform((value) => (value ? value : null)),
  latitude: optionalCoordinate(-90, 90, "Latitude must be between -90 and 90."),
  longitude: optionalCoordinate(-180, 180, "Longitude must be between -180 and 180."),
  timezone: z.string().trim().min(1, "Choose a time zone.").max(80, "Keep the time zone under 80 characters."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. USD."),
  reservationDurationMinutes: z.coerce
    .number()
    .int()
    .min(30, "Seatings must be at least 30 minutes.")
    .max(480, "Seatings can’t be more than 8 hours."),
  isActive: z.boolean().default(true),
  hours_monday: dayHoursField,
  hours_tuesday: dayHoursField,
  hours_wednesday: dayHoursField,
  hours_thursday: dayHoursField,
  hours_friday: dayHoursField,
  hours_saturday: dayHoursField,
  hours_sunday: dayHoursField,
});

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;

/** Assembles the per-day hours fields into the {day: "hours"} shape stored in
 * restaurants.opening_hours. A day left blank is omitted entirely (closed / not published). */
export function buildOpeningHours(data: RestaurantSettingsInput): Record<string, string> | null {
  const entries: [string, string][] = [];
  for (const { key } of OPENING_HOURS_DAYS) {
    const value = data[`hours_${key}` as keyof RestaurantSettingsInput] as string | null;
    if (value) entries.push([key, value]);
  }
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}
