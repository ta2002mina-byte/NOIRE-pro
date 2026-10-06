/**
 * Constants for the visual table reservation flow. Values must match the
 * check constraints on `tables.area`, `reservations.occasion` and
 * `reservation_preferences.preference` in
 * supabase/migrations/20260920000200_noire_02_content.sql and
 * supabase/migrations/20260920000300_noire_03_customer.sql.
 */

export const TABLE_AREAS = [
  { value: "window", label: "Window" },
  { value: "quiet", label: "Quiet" },
  { value: "outdoor", label: "Outdoor" },
  { value: "main_hall", label: "Main Hall" },
  { value: "private_dining", label: "Private Dining" },
  { value: "garden", label: "Garden" },
  { value: "rooftop", label: "Rooftop" },
  { value: "bar", label: "Bar" },
] as const;

export type TableArea = (typeof TABLE_AREAS)[number]["value"];

export function areaLabel(value: string): string {
  return TABLE_AREAS.find((a) => a.value === value)?.label ?? value.replace(/_/g, " ");
}

/** "Celebration Mode" occasions, shared with reservation_preferences’ birthday_setup option. */
export const OCCASIONS = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "proposal", label: "Proposal" },
  { value: "graduation", label: "Graduation" },
  { value: "other", label: "Other" },
] as const;

export type Occasion = (typeof OCCASIONS)[number]["value"];

export function occasionLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return OCCASIONS.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ");
}

export const SEATING_PREFERENCES = [
  { value: "window_seat", label: "Window seat" },
  { value: "quiet", label: "Quiet table" },
  { value: "outdoor", label: "Outdoor seating" },
  { value: "birthday_setup", label: "Birthday setup" },
] as const;

export type SeatingPreference = (typeof SEATING_PREFERENCES)[number]["value"];

export function preferenceLabel(value: string): string {
  return SEATING_PREFERENCES.find((p) => p.value === value)?.label ?? value.replace(/_/g, " ");
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

/** Statuses a customer can still see as "upcoming" / actionable. */
export const LIVE_RESERVATION_STATUSES = ["pending", "confirmed"] as const;

/** UI ceiling for the guest-count stepper. The database allows up to 100
 * (large private-dining bookings); above this we ask the guest to contact
 * the restaurant directly rather than offering a table the floor plan
 * likely can’t seat. */
export const MAX_PARTY_SIZE_ONLINE = 20;

/** How far ahead a guest can book online. */
export const BOOKING_WINDOW_DAYS = 90;

/**
 * Generates a fixed grid of candidate reservation times (24h "HH:MM"),
 * evenly spaced. Restaurant opening hours are admin-entered free text (see
 * `parseOpeningHours` in lib/data/restaurant.ts) and aren’t guaranteed to be
 * machine-parseable, so rather than guess a schedule from that text — which
 * risks fabricating availability — the picker offers this standard service
 * window and shows the restaurant’s published hours alongside it for the
 * guest to match against. Real availability is still decided server-side by
 * table capacity and the no-double-booking constraint.
 */
export function generateTimeSlots(startHour = 11, endHour = 22, stepMinutes = 30): string[] {
  const slots: string[] = [];
  for (let mins = startHour * 60; mins <= endHour * 60; mins += stepMinutes) {
    const h = Math.floor(mins / 60)
      .toString()
      .padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

/** "18:00" -> "6:00 PM" */
export function formatSlotLabel(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number.parseInt(hStr, 10);
  if (!Number.isFinite(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

/** Today’s date as "YYYY-MM-DD", used as the minimum bookable date. */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The last bookable date as "YYYY-MM-DD". */
export function maxDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + BOOKING_WINDOW_DAYS);
  return d.toISOString().slice(0, 10);
}
