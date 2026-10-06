"use server";

import { revalidatePath } from "next/cache";

import { authErrorMessage, NETWORK_ERROR_MESSAGE } from "@/lib/auth/errors";
import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { changePasswordSchema, profileSchema } from "@/lib/validations/auth";

export async function updateProfileAction(_previous: FormState, formData: FormData): Promise<FormState> {
  // Identity comes from the validated session, never from the form.
  const auth = await authorize("user");
  if (!auth.ok) return { status: "error", message: auth.message };

  const values = {
    fullName: readString(formData, "fullName"),
    phone: readString(formData, "phone"),
    avatarUrl: readString(formData, "avatarUrl"),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error), values };
  }

  try {
    // RLS allows a user to update only their own row, and column grants limit this to name/phone/avatar.
    const { data, error } = await auth.supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone, avatar_url: parsed.data.avatarUrl })
      .eq("id", auth.ctx.user.id)
      .select("id");

    if (error) {
      console.error("[profile] Update failed:", error.message);
      return { status: "error", message: "We couldn’t save your changes. Please try again.", values };
    }
    if (!data || data.length === 0) {
      return { status: "error", message: "We couldn’t find your profile. Sign out and back in, then try again.", values };
    }
  } catch (caught) {
    console.error("[profile] Update failed:", caught);
    return { status: "error", message: NETWORK_ERROR_MESSAGE, values };
  }

  revalidatePath("/account", "layout");
  return { status: "success", message: "Your profile is up to date." };
}

export async function changePasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("user");
  if (!auth.ok) return { status: "error", message: auth.message };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: readString(formData, "currentPassword"),
    password: readString(formData, "password"),
    confirmPassword: readString(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const email = auth.ctx.user.email;
  if (!email) return { status: "error", message: "This account has no email address to verify with." };

  try {
    // Re-check the current password so a hijacked session alone can't change it.
    const verify = await auth.supabase.auth.signInWithPassword({ email, password: parsed.data.currentPassword });
    if (verify.error) {
      if (verify.error.code === "invalid_credentials") {
        return {
          status: "error",
          message: "Check the highlighted fields.",
          fieldErrors: { currentPassword: ["That isn’t your current password."] },
        };
      }
      return { status: "error", message: authErrorMessage(verify.error) };
    }

    const { error } = await auth.supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { status: "error", message: authErrorMessage(error) };

    await auth.supabase.auth.signOut({ scope: "others" });
  } catch (caught) {
    console.error("[account] Password change failed:", caught);
    return { status: "error", message: NETWORK_ERROR_MESSAGE };
  }

  return { status: "success", message: "Password updated. Any other devices have been signed out." };
}
