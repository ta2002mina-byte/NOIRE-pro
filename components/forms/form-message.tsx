import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { FormState } from "@/lib/actions/state";
import { cn } from "@/lib/utils";

/** Errors are announced at once (role=alert); success is announced politely (role=status). */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const isError = state.status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        isError ? "border-danger/40 bg-danger/10 text-danger" : "border-good/40 bg-good/10 text-good",
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <p>{state.message}</p>
    </div>
  );
}
