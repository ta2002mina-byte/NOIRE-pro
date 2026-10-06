import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { requireAccess } from "@/lib/auth/session";
import { getPassportOverview } from "@/lib/data/passport";

export const metadata: Metadata = { title: "Dining Passport" };

export default async function AdminPassportPage() {
  await requireAccess("/admin/passport");

  const overview = await getPassportOverview(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Dining passport</h1>
        <p className="mt-2 max-w-prose text-mute">
          Visits, dishes explored, experiences completed and milestones earned — calculated from verified visits,
          most visits first.
        </p>
      </div>

      {overview.length === 0 ? (
        <EmptyState
          title="No passports yet."
          description="A customer's passport starts once their first reservation is marked completed."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-mute">
                <th className="px-4 py-3 font-normal">Guest</th>
                <th className="px-4 py-3 font-normal">Visits</th>
                <th className="px-4 py-3 font-normal">Dishes explored</th>
                <th className="px-4 py-3 font-normal">Experiences completed</th>
                <th className="px-4 py-3 font-normal">Milestones earned</th>
                <th className="px-4 py-3 font-normal sr-only">Open</th>
              </tr>
            </thead>
            <tbody>
              {overview.map((row) => (
                <tr key={row.customerId} className="border-b border-line last:border-0 hover:bg-raised/50">
                  <td className="px-4 py-3 text-ivory">
                    <div>{row.fullName ?? "Unnamed guest"}</div>
                    <div className="text-xs text-mute">{row.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-ivory">{row.visitsCount}</td>
                  <td className="px-4 py-3 text-ivory">{row.dishesExploredCount}</td>
                  <td className="px-4 py-3 text-ivory">{row.experiencesCompletedCount}</td>
                  <td className="px-4 py-3 text-ivory">{row.milestonesEarned}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/customers/${row.customerId}`} className="text-xs text-ivory underline underline-offset-4">
                      View
                    </Link>
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
