/** Pure helpers for the transactional emails — no I/O, so they are unit-testable. */

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Keeps header-ish values on one line (no CR/LF injection into subjects). */
export function singleLine(value: string): string {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ").trim();
}

function shell(title: string, bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
<h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h2>
${bodyHtml}
</div>`;
}

export function contactNotificationEmail(input: {
  restaurantName: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}): { subject: string; html: string; text: string } {
  const subject = singleLine(`New message${input.subject ? `: ${input.subject}` : ` from ${input.name}`}`).slice(0, 200);
  const lines = [
    `From: ${singleLine(input.name)} <${singleLine(input.email)}>`,
    input.phone ? `Phone: ${singleLine(input.phone)}` : null,
    input.subject ? `Subject: ${singleLine(input.subject)}` : null,
  ].filter((line): line is string => Boolean(line));

  const html = shell(
    `New message for ${input.restaurantName}`,
    `<p style="margin:0 0 12px;color:#555">${lines.map(escapeHtml).join("<br>")}</p>
<div style="white-space:pre-wrap;border-left:3px solid #ccc;padding-left:12px">${escapeHtml(input.message)}</div>
<p style="margin:16px 0 0;color:#777;font-size:12px">Reply to this email to answer ${escapeHtml(singleLine(input.name))} directly.</p>`,
  );
  const text = `${lines.join("\n")}\n\n${input.message}`;
  return { subject, html, text };
}

export function reservationStatusEmail(input: {
  restaurantName: string;
  confirmed: boolean;
  when: string;
  accountUrl: string;
}): { subject: string; html: string; text: string } {
  const title = input.confirmed ? "Your reservation is confirmed" : "Your reservation was cancelled";
  const body = input.confirmed
    ? `We’re looking forward to seeing you at ${input.restaurantName} on ${input.when}.`
    : `Your reservation at ${input.restaurantName} for ${input.when} was cancelled by the restaurant. Please get in touch if you have any questions.`;
  const html = shell(
    title,
    `<p style="margin:0 0 16px">${escapeHtml(body)}</p>
<p style="margin:0"><a href="${escapeHtml(input.accountUrl)}">View your reservations</a></p>`,
  );
  return { subject: singleLine(`${title} — ${input.restaurantName}`), html, text: `${body}\n\n${input.accountUrl}` };
}
