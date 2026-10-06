"use client";

import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { QuickActionButton } from "@/components/admin/quick-action-button";
import { deleteContactMessageAction, setContactStatusAction } from "@/lib/actions/contact";
import type { ContactStatus } from "@/lib/validations/contact";

function nextActions(status: string): { label: string; next: ContactStatus }[] {
  switch (status) {
    case "new":
      return [
        { label: "Mark read", next: "read" },
        { label: "Mark replied", next: "replied" },
      ];
    case "read":
      return [
        { label: "Mark replied", next: "replied" },
        { label: "Archive", next: "archived" },
      ];
    case "replied":
      return [{ label: "Archive", next: "archived" }];
    case "archived":
      return [{ label: "Move to inbox", next: "read" }];
    default:
      return [];
  }
}

export function ContactMessageActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex flex-wrap items-start justify-end gap-2">
      {nextActions(status).map((action) => (
        <QuickActionButton key={action.next} label={action.label} action={() => setContactStatusAction(id, action.next)} />
      ))}
      <ConfirmActionButton label="Delete" confirmMessage="Delete this message?" confirmLabel="Yes, delete" action={() => deleteContactMessageAction(id)} />
    </div>
  );
}
