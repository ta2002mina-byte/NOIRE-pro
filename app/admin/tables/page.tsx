import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { DeleteTableButton } from "@/components/admin/delete-table-button";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { areaLabel } from "@/lib/constants/reservation";
import { getTablesForAdmin } from "@/lib/data/tables";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Tables" };

export default async function AdminTablesPage() {
  await requireAccess("/admin/tables");
  const restaurant = await getRestaurant();
  const tables = restaurant ? await getTablesForAdmin(restaurant.id) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Tables</h1>
          <p className="mt-2 max-w-prose text-mute">
            The tables guests can choose on the reservation floor plan. Inactive tables stay here but aren’t offered
            for booking.
          </p>
        </div>
        {restaurant ? (
          <Link href="/admin/tables/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New table
          </Link>
        ) : null}
      </div>

      {!restaurant ? (
        <EmptyState title="No restaurant record yet." description="Tables are attached to a restaurant. Create the restaurant record first." />
      ) : tables.length === 0 ? (
        <EmptyState title="No tables yet." description="Add your first table so guests can pick a seat.">
          <Link href="/admin/tables/new" className={buttonStyles({ variant: "primary" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New table
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-mute">
                <th className="px-4 py-3 font-normal">Table</th>
                <th className="px-4 py-3 font-normal">Area</th>
                <th className="px-4 py-3 font-normal">Seats</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className="border-b border-line last:border-0 hover:bg-raised/50">
                  <td className="px-4 py-3 text-ivory">{table.label}</td>
                  <td className="px-4 py-3 text-mute">{areaLabel(table.area)}</td>
                  <td className="px-4 py-3 text-mute">
                    {table.min_capacity === table.capacity ? table.capacity : `${table.min_capacity}–${table.capacity}`}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{table.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/tables/${table.id}`} className="text-xs text-ivory underline underline-offset-4">
                        Edit
                      </Link>
                      <DeleteTableButton id={table.id} label={table.label} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
