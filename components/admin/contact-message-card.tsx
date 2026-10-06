import { Badge } from "@/components/ui/badge";
import { ContactMessageActions } from "@/components/admin/contact-message-actions";
import type { ContactMessage } from "@/lib/data/contact";
import { formatDateTime } from "@/lib/utils/format";

const STATUS_LABELS: Record<string, string> = { new: "New", read: "Read", replied: "Replied", archived: "Archived" };

export function ContactMessageCard({ message }: { message: ContactMessage }) {
  const subject = message.subject?.trim();
  return (
    <li className="rounded-2xl border border-line bg-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg text-ivory">{subject || `Message from ${message.name}`}</p>
          <p className="mt-1 text-sm text-mute">
            {message.name} ·{" "}
            <a href={`mailto:${message.email}`} className="break-all underline hover:text-ivory">
              {message.email}
            </a>
            {message.phone ? (
              <>
                {" "}
                ·{" "}
                <a href={`tel:${message.phone}`} className="underline hover:text-ivory">
                  {message.phone}
                </a>
              </>
            ) : null}{" "}
            · {formatDateTime(message.created_at)}
          </p>
        </div>
        <Badge tone={message.status === "new" ? "claret" : "outline"}>{STATUS_LABELS[message.status] ?? message.status}</Badge>
      </div>

      <p className="mt-3 max-w-prose whitespace-pre-wrap break-words text-sm text-ivory/90">{message.message}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <a
          href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${subject || "Your message to NOIRÉ"}`)}`}
          className="text-sm text-blush underline hover:text-ivory"
        >
          Reply by email
        </a>
        <ContactMessageActions id={message.id} status={message.status} />
      </div>
    </li>
  );
}
