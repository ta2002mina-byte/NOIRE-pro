"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setChefNoteStatusAction } from "@/lib/actions/chef";
import type { ChefNoteStatus } from "@/lib/validations/chef-note";

/** The status-appropriate next actions — never more than two, so the card stays scannable. */
function actionsFor(status: string): { label: string; next: ChefNoteStatus; clearSchedule: boolean }[] {
  switch (status) {
    case "draft":
      return [{ label: "Publish now", next: "published", clearSchedule: true }];
    case "scheduled":
      return [
        { label: "Publish now", next: "published", clearSchedule: true },
        { label: "Cancel schedule", next: "draft", clearSchedule: true },
      ];
    case "published":
      return [
        { label: "Unpublish", next: "draft", clearSchedule: true },
        { label: "Archive", next: "archived", clearSchedule: false },
      ];
    case "archived":
      return [{ label: "Restore to draft", next: "draft", clearSchedule: false }];
    default:
      return [];
  }
}

export function ChefNoteStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [pendingLabel, setPendingLabel] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {actionsFor(status).map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            loading={pending && pendingLabel === action.label}
            disabled={pending}
            onClick={() => {
              setError(null);
              setPendingLabel(action.label);
              startTransition(async () => {
                const result = await setChefNoteStatusAction(id, action.next, action.clearSchedule);
                if (result.ok) {
                  router.refresh();
                } else {
                  setError(result.message);
                }
              });
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
