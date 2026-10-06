import type { AuthError } from "@supabase/supabase-js";

export const NETWORK_ERROR_MESSAGE = "We couldn’t reach the server. Check your connection and try again.";
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** Friendly, non-revealing messages for Supabase auth errors. */
export function authErrorMessage(error: Pick<AuthError, "message" | "code">): string {
  switch (error.code) {
    case "invalid_credentials":
      return "The email or password is incorrect.";
    case "email_not_confirmed":
      return "Confirm your email first. We sent you a link when you signed up.";
    case "weak_password":
      return "Choose a stronger password with at least 8 characters.";
    case "same_password":
      return "Choose a password you haven’t used before.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "signup_disabled":
      return "New sign-ups are turned off right now.";
    case "session_not_found":
    case "refresh_token_not_found":
    case "bad_jwt":
      return "Your session has ended. Sign in again to continue.";
    default:
      break;
  }
  if (/fetch|network/i.test(error.message)) return NETWORK_ERROR_MESSAGE;
  return GENERIC_ERROR_MESSAGE;
}
