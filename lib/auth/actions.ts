"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDefaultLandingPath, isRole, resolvePostLoginPath, type Role } from "@/lib/auth/access";
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE, authErrorMessage } from "@/lib/auth/errors";
import { authorize } from "@/lib/auth/session";
import { readString, toFieldErrors, type FormState } from "@/lib/actions/state";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth";

const CHECK_FIELDS = "Check the highlighted fields.";

// NOTE: redirect() works by throwing, so it is always called OUTSIDE try/catch blocks below.

export async function signInAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { email: readString(formData, "email") };
  const parsed = signInSchema.safeParse({ email: values.email, password: readString(formData, "password") });
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: toFieldErrors(parsed.error), values };
  }

  let role: Role = "customer";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      return { status: "error", message: error ? authErrorMessage(error) : GENERIC_ERROR_MESSAGE, values };
    }

    // Read the role from the database (as the user, under RLS). It decides where they land.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile && isRole(profile.role)) role = profile.role;
  } catch (caught) {
    console.error("[auth] Sign in failed:", caught);
    return { status: "error", message: NETWORK_ERROR_MESSAGE, values };
  }

  revalidatePath("/", "layout");
  redirect(resolvePostLoginPath(role, readString(formData, "next")));
}

export async function signUpAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { fullName: readString(formData, "fullName"), email: readString(formData, "email") };
  const parsed = signUpSchema.safeParse({
    ...values,
    password: readString(formData, "password"),
    confirmPassword: readString(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: toFieldErrors(parsed.error), values };
  }

  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        // Stored as metadata; the database trigger copies the name into profiles.
        // The role is NOT taken from here: the trigger always creates a 'customer'.
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${await getSiteUrl()}/auth/callback?next=/account`,
      },
    });
    if (error) return { status: "error", message: authErrorMessage(error), values };
    signedIn = Boolean(data.session);
  } catch (caught) {
    console.error("[auth] Sign up failed:", caught);
    return { status: "error", message: NETWORK_ERROR_MESSAGE, values };
  }

  if (signedIn) {
    // Email confirmation is switched off in Supabase: the user already has a session.
    revalidatePath("/", "layout");
    redirect("/account");
  }

  // Same message whether or not the address was already registered, so this form can't be used to probe for accounts.
  return {
    status: "success",
    message: `If ${parsed.data.email} can be used to create an account, a confirmation link is on its way. Open it in this browser to finish signing up.`,
  };
}

export async function forgotPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { email: readString(formData, "email") };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: toFieldErrors(parsed.error), values };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${await getSiteUrl()}/auth/callback?next=/reset-password`,
    });
    if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
      return { status: "error", message: authErrorMessage(error), values };
    }
    // Any other outcome looks identical to the visitor, whether or not the account exists.
  } catch (caught) {
    console.error("[auth] Password reset request failed:", caught);
    return { status: "error", message: NETWORK_ERROR_MESSAGE, values };
  }

  return {
    status: "success",
    message: `If an account exists for ${parsed.data.email}, we’ve sent a link to reset the password. Open it in this browser.`,
  };
}

export async function resetPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: readString(formData, "password"),
    confirmPassword: readString(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: toFieldErrors(parsed.error) };
  }

  // The emailed link signs the user in (via /auth/callback). No session means the link was invalid or expired.
  const auth = await authorize("user");
  if (!auth.ok) {
    return { status: "error", message: "This reset link has expired or was already used. Request a new one." };
  }

  try {
    const { error } = await auth.supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { status: "error", message: authErrorMessage(error) };

    // A reset should end any other device that was signed in with the old password.
    await auth.supabase.auth.signOut({ scope: "others" });
  } catch (caught) {
    console.error("[auth] Password reset failed:", caught);
    return { status: "error", message: NETWORK_ERROR_MESSAGE };
  }

  revalidatePath("/", "layout");
  redirect(getDefaultLandingPath(auth.ctx.role));
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (caught) {
    console.error("[auth] Sign out failed:", caught);
  }
  revalidatePath("/", "layout");
  redirect("/");
}
