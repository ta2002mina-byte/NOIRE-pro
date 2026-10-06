/**
 * <input type="datetime-local"> has no time zone. The banner dates are entered
 * and shown in the restaurant's own time zone, and stored as UTC (timestamptz).
 */

function offsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - (date.getTime() - date.getMilliseconds());
}

function safeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** "2026-10-01T18:00" as wall-clock time in `timeZone` -> a UTC Date. Null if malformed. */
export function zonedLocalToUtc(local: string, timeZone: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];
  const zone = safeZone(timeZone);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes so a date next to a DST change still lands on the right instant.
  let ts = guess - offsetMs(new Date(guess), zone);
  ts = guess - offsetMs(new Date(ts), zone);
  const result = new Date(ts);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** A stored UTC timestamp -> "YYYY-MM-DDTHH:mm" wall-clock time in `timeZone`, for the input. */
export function utcToZonedLocal(iso: string | null | undefined, timeZone: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + offsetMs(date, safeZone(timeZone))).toISOString().slice(0, 16);
}
