import { z } from "zod";

import { MAX_PARTY_SIZE_ONLINE, OCCASIONS, SEATING_PREFERENCES } from "@/lib/constants/reservation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const occasionValues = OCCASIONS.map((o) => o.value) as [string, ...string[]];
const preferenceValues = SEATING_PREFERENCES.map((p) => p.value) as [string, ...string[]];

export const dateField = z.string().regex(DATE_RE, "Choose a date.");
export const timeField = z.string().regex(TIME_RE, "Choose a time.");
export const guestCountField = z.coerce
  .number()
  .int("Choose a whole number of guests.")
  .min(1, "At least 1 guest is required.")
  .max(MAX_PARTY_SIZE_ONLINE, `For parties over ${MAX_PARTY_SIZE_ONLINE}, please contact us directly.`);

/** What the client sends to check which tables are open for a slot. */
export const availabilityQuerySchema = z.object({
  date: dateField,
  time: timeField,
  guestCount: guestCountField,
  experienceId: z.string().uuid().nullable().optional(),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/** The full booking submitted from the final review step. */
export const reservationDraftSchema = z.object({
  date: dateField,
  time: timeField,
  guestCount: guestCountField,
  experienceId: z.string().uuid().nullable().optional(),
  occasion: z.enum(occasionValues).nullable().optional(),
  preferences: z.array(z.enum(preferenceValues)).max(SEATING_PREFERENCES.length).default([]),
  tableId: z.string().uuid("Choose a table on the floor plan."),
  specialRequest: z
    .string()
    .trim()
    .max(1000, "Keep special requests under 1000 characters.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type ReservationDraftInput = z.infer<typeof reservationDraftSchema>;

// ---------------------------------------------------------------------
// Admin editing — a wider net than the guest-facing draft: staff may
// clear the table, use the database's full guest-count range, set
// contact details for a walk-in, and change status directly.
// ---------------------------------------------------------------------

export const RESERVATION_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

const adminGuestCountField = z.coerce
  .number()
  .int("Choose a whole number of guests.")
  .min(1, "At least 1 guest is required.")
  .max(100, "100 guests is the most a single reservation can hold.");

export const adminReservationSchema = z.object({
  date: dateField,
  time: timeField,
  guestCount: adminGuestCountField,
  experienceId: z.string().uuid().nullable().optional(),
  tableId: z.string().uuid().nullable().optional(),
  occasion: z.enum(occasionValues).nullable().optional(),
  preferences: z.array(z.enum(preferenceValues)).max(SEATING_PREFERENCES.length).default([]),
  specialRequest: z
    .string()
    .trim()
    .max(1000, "Keep special requests under 1000 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  status: z.enum(RESERVATION_STATUSES),
  contactName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : null)),
  contactPhone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => (value ? value : null)),
  contactEmail: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
    .optional()
    .transform((value) => (value ? value : null)),
});

export type AdminReservationInput = z.infer<typeof adminReservationSchema>;
