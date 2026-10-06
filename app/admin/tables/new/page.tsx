import type { Metadata } from "next";

import { TableForm } from "@/components/admin/table-form";
import { createTableAction } from "@/lib/actions/tables";
import { requireAccess } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New table" };

export default async function NewTablePage() {
  await requireAccess("/admin/tables/new");

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl sm:text-4xl">New table</h1>
      <TableForm action={createTableAction} />
    </div>
  );
}
