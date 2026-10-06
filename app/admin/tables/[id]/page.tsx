import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteTableButton } from "@/components/admin/delete-table-button";
import { TableForm } from "@/components/admin/table-form";
import { updateTableAction } from "@/lib/actions/tables";
import { requireAccess } from "@/lib/auth/session";
import { getTableByIdForAdmin } from "@/lib/data/tables";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit table" };

export default async function EditTablePage({ params }: PageProps) {
  await requireAccess("/admin/tables");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const table = restaurant ? await getTableByIdForAdmin(restaurant.id, id) : null;
  if (!table) notFound();

  const updateThisTable = updateTableAction.bind(null, table.id);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl">Edit table {table.label}</h1>
        <DeleteTableButton id={table.id} label={table.label} redirectTo="/admin/tables" />
      </div>
      <TableForm table={table} action={updateThisTable} />
    </div>
  );
}
