export function formatPrice(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * An unknown time-zone name (for example a typo saved in restaurant settings)
 * makes Intl throw, which would take the whole page down. Fall back to UTC instead.
 */
function formatWithZone(options: Intl.DateTimeFormatOptions, date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
}

export function formatDateLong(value: string | Date, timeZone?: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatWithZone({ weekday: "long", month: "long", day: "numeric", year: "numeric" }, date, timeZone);
}

export function formatTime(value: string | Date, timeZone?: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatWithZone({ hour: "numeric", minute: "2-digit" }, date, timeZone);
}

/** "March 4, 2026 at 6:30 PM" — a compact date + time for admin lists (chef note schedules, etc). */
export function formatDateTime(value: string | Date, timeZone?: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatWithZone(
    { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" },
    date,
    timeZone,
  );
}

/** "March 4, 2026" from a YYYY-MM-DD column, without shifting the day across time zones. */
export function formatDateOnly(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}
