"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getRestaurant } from "@/lib/data/restaurant";
import { sendEmail } from "@/lib/email/send";
import { contactNotificationEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { contactMessageSchema, isContactStatus, type ContactStatus } from "@/lib/validations/contact";

type SimpleActionResult = { ok: true } | { ok: false; message: string };

const SUCCESS: FormState = {
  status: "success",
  message: "Thank you — your message is on its way to our team. We’ll reply by email soon.",
};

/** Public Contact form. Works for signed-out visitors. */
export async function submitContactMessageAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
  if (readString(formData, "website").trim() !== "") return SUCCESS;

  const raw = {
    name: readString(formData, "name"),
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    subject: readString(formData, "subject"),
    message: readString(formData, "message"),
  };

  const parsed = contactMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values: raw };
  }

  const restaurant = await getRestaurant();
  if (!restaurant) {
    return { status: "error", message: "Messages aren’t available right now. Please try again shortly.", values: raw };
  }

  const { data } = parsed;
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    restaurant_id: restaurant.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
  });

  if (error) {
    console.error("[contact] Save failed:", error.message);
    return { status: "error", message: "We couldn’t send your message. Please try again.", values: raw };
  }

  // Optional email alert to the restaurant. The message is already saved, so a mail problem is harmless.
  const notifyTo = process.env.CONTACT_NOTIFY_EMAIL?.trim() || restaurant.email;
  if (notifyTo) {
    const mail = contactNotificationEmail({ restaurantName: restaurant.name, ...data });
    await sendEmail({ to: notifyTo, replyTo: data.email, ...mail });
  }

  revalidatePath("/admin/messages");
  return SUCCESS;
}

export async function setContactStatusAction(messageId: string, status: ContactStatus): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };
  if (!isContactStatus(status)) return { ok: false, message: "That isn’t a valid status." };

  const { data, error } = await auth.supabase.from("contact_messages").update({ status }).eq("id", messageId).select("id");
  if (error) {
    console.error("[contact] Status update failed:", error.message);
    return { ok: false, message: "We couldn’t update that message. Please try again." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That message couldn’t be found." };

  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function deleteContactMessageAction(messageId: string): Promise<SimpleActionResult> {
  const auth = await authorize("staff");
  if (!auth.ok) return { ok: false, message: auth.message };

  const { data, error } = await auth.supabase.from("contact_messages").delete().eq("id", messageId).select("id");
  if (error) {
    console.error("[contact] Delete failed:", error.message);
    return { ok: false, message: "We couldn’t delete that message. Please try again." };
  }
  if (!data || data.length === 0) return { ok: false, message: "That message couldn’t be found." };

  revalidatePath("/admin/messages");
  return { ok: true };
}
