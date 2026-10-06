"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurantForAdmin } from "@/lib/data/restaurant";
import { buildOpeningHours, OPENING_HOURS_DAYS, restaurantSettingsSchema } from "@/lib/validations/restaurant-settings";

/** Every route that reads restaurant details, hours or reservation rules. */
function revalidateSettingsPaths() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/reserve");
}

function readSettingsForm(formData: FormData) {
  const raw: Record<string, string> = {
    name: readString(formData, "name"),
    tagline: readString(formData, "tagline"),
    description: readString(formData, "description"),
    addressLine: readString(formData, "addressLine"),
    city: readString(formData, "city"),
    region: readString(formData, "region"),
    postalCode: readString(formData, "postalCode"),
    country: readString(formData, "country"),
    phone: readString(formData, "phone"),
    email: readString(formData, "email"),
    latitude: readString(formData, "latitude"),
    longitude: readString(formData, "longitude"),
    timezone: readString(formData, "timezone"),
    currency: readString(formData, "currency"),
    reservationDurationMinutes: readString(formData, "reservationDurationMinutes") || "120",
  };
  for (const { key } of OPENING_HOURS_DAYS) {
    raw[`hours_${key}`] = readString(formData, `hours_${key}`);
  }
  raw.isActive = formData.get("isActive") === "on" ? "on" : "";
  return raw;
}

function toEchoValues(raw: ReturnType<typeof readSettingsForm>): Record<string, string> {
  const echo = { ...raw };
  delete echo.isActive;
  return echo;
}

/**
 * NOIRÉ is single-tenant: this updates the one restaurant row (creating it the
 * first time there isn't one yet), never a row chosen by the client.
 */
export async function updateRestaurantSettingsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("admin");
  if (!auth.ok) return { status: "error", message: auth.message };

  const raw = readSettingsForm(formData);
  const parsed = restaurantSettingsSchema.safeParse({ ...raw, isActive: formData.get("isActive") === "on" });
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: toEchoValues(raw) };
  }

  const { data } = parsed;
  const payload = {
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    address_line: data.addressLine,
    city: data.city,
    region: data.region,
    postal_code: data.postalCode,
    country: data.country,
    phone: data.phone,
    email: data.email,
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    currency: data.currency,
    reservation_duration_minutes: data.reservationDurationMinutes,
    opening_hours: buildOpeningHours(data),
    is_active: data.isActive,
  };

  const existing = await getRestaurantForAdmin();

  const { error } = existing
    ? await auth.supabase.from("restaurants").update(payload).eq("id", existing.id)
    : await auth.supabase.from("restaurants").insert({
        ...payload,
        slug: data.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "restaurant",
      });

  if (error) {
    console.error("[settings] Save failed:", error.message);
    return { status: "error", message: "We couldn’t save these settings. Please try again.", values: toEchoValues(raw) };
  }

  revalidateSettingsPaths();
  return { status: "success", message: "Settings saved." };
}
