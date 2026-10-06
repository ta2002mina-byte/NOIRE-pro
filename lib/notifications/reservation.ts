import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getRestaurant } from "@/lib/data/restaurant";
import { sendEmail } from "@/lib/email/send";
import { reservationStatusEmail } from "@/lib/email/templates";
import { SITE_URL } from "@/lib/env";
import { formatDateOnly } from "@/lib/utils/format";
import type { Database } from "@/types/database";

type ReservationRef = {
  customer_id: string | null;
  reservation_date: string;
  reservation_time: string;
};

/**
 * Tells the guest when staff confirm or cancel their reservation. Only those two
 * transitions are worth a message; everything else (pending, completed, no-show)
 * is internal bookkeeping. Walk-ins have no customer account, so nothing is sent.
 *
 * Runs as the signed-in staff member — RLS (`notifications_staff_insert`) allows it.
 * A failure here is logged but never blocks the status change itself.
 */
export async function notifyReservationStatusChange(
  supabase: SupabaseClient<Database>,
  reservation: ReservationRef,
  previousStatus: string | null,
  nextStatus: string,
): Promise<void> {
  if (!reservation.customer_id || previousStatus === nextStatus) return;
  if (nextStatus !== "confirmed" && nextStatus !== "cancelled") return;

  const when = `${formatDateOnly(reservation.reservation_date)} at ${reservation.reservation_time.slice(0, 5)}`;
  const confirmed = nextStatus === "confirmed";

  const { error } = await supabase.from("notifications").insert({
    customer_id: reservation.customer_id,
    type: confirmed ? "reservation_confirmed" : "reservation_cancelled",
    title: confirmed ? "Your reservation is confirmed" : "Your reservation was cancelled",
    body: confirmed
      ? `We’re looking forward to seeing you on ${when}.`
      : `Your reservation for ${when} was cancelled by the restaurant. Please get in touch if you have any questions.`,
    link_url: "/account/reservations",
  });

  if (error) console.error("[notifications] Reservation notice failed:", error.message);

  // Optional email copy (needs RESEND_API_KEY + EMAIL_FROM; otherwise silently skipped).
  try {
    const [{ data: profile }, restaurant] = await Promise.all([
      supabase.from("profiles").select("email").eq("id", reservation.customer_id).maybeSingle(),
      getRestaurant(),
    ]);
    if (profile?.email) {
      const mail = reservationStatusEmail({
        restaurantName: restaurant?.name ?? "NOIRÉ",
        confirmed,
        when,
        accountUrl: `${SITE_URL}/account/reservations`,
      });
      await sendEmail({ to: profile.email, replyTo: restaurant?.email ?? undefined, ...mail });
    }
  } catch (mailError) {
    console.error("[notifications] Reservation email failed:", mailError instanceof Error ? mailError.message : "unknown error");
  }
}
