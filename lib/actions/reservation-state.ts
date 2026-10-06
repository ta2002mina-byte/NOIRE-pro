import type { FieldErrors } from "@/lib/actions/state";

export interface CreateReservationState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
  reservationId?: string;
}

export const initialReservationState: CreateReservationState = { status: "idle" };