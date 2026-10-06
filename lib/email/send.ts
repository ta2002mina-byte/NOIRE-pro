import "server-only";

/**
 * Sends one transactional email through Resend (https://resend.com) using plain fetch — no SDK.
 *
 * Email is OPTIONAL. Without RESEND_API_KEY and EMAIL_FROM this does nothing and returns
 * { sent: false }, so the site works exactly the same before email is configured. A failure
 * is logged and returned, never thrown: an email problem must never break a booking or a form.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[email] Send failed:", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] Send failed:", error instanceof Error ? error.message : "unknown error");
    return { sent: false };
  }
}
