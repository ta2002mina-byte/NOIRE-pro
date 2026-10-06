import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReservationEditForm } from "@/components/admin/reservation-edit-form";
import { requireAccess } from "@/lib/auth/session";
import { adminUpdateReservationAction } from "@/lib/actions/reservation";
import { getAllTablesForAdmin, getReservationByIdForAdmin } from "@/lib/data/reservation";
import { getAllExperiences } from "@/lib/data/experiences";
import { getRestaurant } from "@/lib/data/restaurant";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit reservation" };

export default async function EditReservationPage({ params }: PageProps) {
  await requireAccess("/admin/reservations");
  const { id } = await params;

  const restaurant = await getRestaurant();
  const reservation = restaurant ? await getReservationByIdForAdmin(restaurant.id, id) : null;
  if (!reservation) notFound();

  const [tables, experiences] = await Promise.all([
    getAllTablesForAdmin(restaurant!.id),
    getAllExperiences(restaurant!.id),
  ]);

  const updateThisReservation = adminUpdateReservationAction.bind(null, reservation.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl">Edit reservation</h1>
        <p className="mt-2 text-sm text-mute">Created {new Date(reservation.created_at).toLocaleString()}</p>
      </div>
      <ReservationEditForm reservation={reservation} tables={tables} experiences={experiences} action={updateThisReservation} />
    </div>
  );
}
