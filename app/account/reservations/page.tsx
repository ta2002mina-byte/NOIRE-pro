import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationList } from "@/components/account/reservation-list";
import { requireAccess } from "@/lib/auth/session";
import { getCustomerReservations } from "@/lib/data/reservation";

export const metadata: Metadata = { title: "Reservations" };

export default async function Page() {
  const ctx = await requireAccess("/account/reservations");
  const reservations = await getCustomerReservations(ctx.user.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ivory">Reservations</h1>
          <p className="mt-1 text-sm text-mute">Your upcoming and past tables at NOIRÉ.</p>
        </div>
        <Link href="/reserve" className={buttonStyles({ variant: "primary", size: "sm" })}>
          Reserve a table
        </Link>
      </div>

      <div className="mt-8">
        {reservations.length === 0 ? (
          <EmptyState
            title="No reservations yet"
            description="When you reserve a table, it will show up here with its status."
          >
            <Link href="/reserve" className={buttonStyles({ variant: "primary" })}>
              Reserve a table
            </Link>
          </EmptyState>
        ) : (
          <ReservationList reservations={reservations} />
        )}
      </div>
    </div>
  );
}
