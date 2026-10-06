import type { Metadata } from "next";
import Link from "next/link";

import { ContactMessageCard } from "@/components/admin/contact-message-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAccess } from "@/lib/auth/session";
import { getContactMessagesForAdmin, getContactStatusCounts } from "@/lib/data/contact";
import { getRestaurant } from "@/lib/data/restaurant";
import { cn } from "@/lib/utils";
import { isContactStatus, type ContactStatus } from "@/lib/validations/contact";

export const metadata: Metadata = { title: "Messages" };

const PAGE_SIZE = 15;

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  await requireAccess("/admin/messages");
  const params = await searchParams;
  const status: ContactStatus | undefined = isContactStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const restaurant = await getRestaurant();

  let messages: Awaited<ReturnType<typeof getContactMessagesForAdmin>>["messages"] = [];
  let total = 0;
  let counts: Record<ContactStatus, number> = { new: 0, read: 0, replied: 0, archived: 0 };

  if (restaurant) {
    const [result, statusCounts] = await Promise.all([
      getContactMessagesForAdmin(restaurant.id, { status, page, pageSize: PAGE_SIZE }),
      getContactStatusCounts(restaurant.id),
    ]);
    messages = result.messages;
    total = result.total;
    counts = statusCounts;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allTotal = counts.new + counts.read + counts.replied + counts.archived;
  const tabs: { value: ContactStatus | ""; label: string; count: number }[] = [
    { value: "", label: "All", count: allTotal },
    { value: "new", label: "New", count: counts.new },
    { value: "read", label: "Read", count: counts.read },
    { value: "replied", label: "Replied", count: counts.replied },
    { value: "archived", label: "Archived", count: counts.archived },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Messages</h1>
        <p className="mt-2 max-w-prose text-mute">Messages sent through the Contact form. Reply by email, then mark them as replied.</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {tabs.map((tab) => (
          <Link
            key={tab.value || "all"}
            href={tab.value ? `/admin/messages?status=${tab.value}` : "/admin/messages"}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              (status ?? "") === tab.value ? "border-ivory bg-raised text-ivory" : "border-line text-mute hover:border-ivory/60",
            )}
          >
            {tab.label} <span className="text-xs text-mute">({tab.count})</span>
          </Link>
        ))}
      </nav>

      {!restaurant ? (
        <EmptyState title="No restaurant record yet." description="Messages are attached to a restaurant." />
      ) : messages.length === 0 ? (
        <EmptyState
          title="No messages here."
          description={status ? "Nothing with this status yet." : "Messages from the Contact form will appear here."}
        />
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <ContactMessageCard key={message.id} message={message} />
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        itemLabel="messages"
        basePath="/admin/messages"
        params={{ status: status ?? "" }}
      />
    </div>
  );
}
