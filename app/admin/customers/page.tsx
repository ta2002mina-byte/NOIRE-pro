import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAccess } from "@/lib/auth/session";
import { getCustomersForAdmin } from "@/lib/data/customers";
import { getRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  await requireAccess("/admin/customers");
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const restaurant = await getRestaurant();
  const { customers, total } = restaurant
    ? await getCustomersForAdmin(restaurant.id, { search, page, pageSize: PAGE_SIZE })
    : { customers: [], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Customers</h1>
        <p className="mt-2 max-w-prose text-mute">
          Visits, dishes tried, favorites, reviews, last visit and favorite experience — open a customer for the
          full picture.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4" action="/admin/customers">
        <div className="min-w-56 flex-1 space-y-1.5">
          <label htmlFor="cust-search" className="block text-xs uppercase tracking-[0.08em] text-mute">
            Search
          </label>
          <input
            id="cust-search"
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Name, email or phone"
            className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ivory placeholder:text-mute/70"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="h-10 rounded-full bg-claret px-5 text-sm font-medium text-ivory hover:bg-claret-hover">
            Search
          </button>
          {search ? (
            <Link href="/admin/customers" className="flex h-10 items-center rounded-full border border-line px-5 text-sm text-ivory hover:border-ivory/60">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {customers.length === 0 ? (
        <EmptyState title="No customers found." description={search ? "Try a different search." : "No one has created an account yet."} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-mute">
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Contact</th>
                <th className="px-4 py-3 font-normal">Visits</th>
                <th className="px-4 py-3 font-normal">Dishes explored</th>
                <th className="px-4 py-3 font-normal sr-only">Open</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-line last:border-0 hover:bg-raised/50">
                  <td className="px-4 py-3 text-ivory">{customer.full_name ?? "Unnamed guest"}</td>
                  <td className="px-4 py-3 text-mute">
                    <div>{customer.email ?? "—"}</div>
                    {customer.phone ? <div className="text-xs">{customer.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-ivory">{customer.visits_count}</td>
                  <td className="px-4 py-3 text-ivory">{customer.dishes_explored_count}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/customers/${customer.id}`} className="text-xs text-ivory underline underline-offset-4">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        itemLabel="customers"
        basePath="/admin/customers"
        params={{ search }}
      />
    </div>
  );
}
