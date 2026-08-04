import { api, authHeaders } from "@/config/api";
import type { Availability } from "../types";

export type GetAvailabilityParams = {
  professionalId: string;
  procedureId: string;
  /** Dia no formato `YYYY-MM-DD` — o backend interpreta em hora local. */
  date: string;
  excludeAppointmentId?: string;
};

export async function getAvailability(
  params: GetAvailabilityParams,
  accessToken: string,
): Promise<Availability> {
  return api
    .get("appointments/availability", {
      headers: authHeaders(accessToken),
      searchParams: {
        professionalId: params.professionalId,
        procedureId: params.procedureId,
        date: params.date,
        ...(params.excludeAppointmentId
          ? { excludeAppointmentId: params.excludeAppointmentId }
          : {}),
      },
    })
    .json<Availability>();
}
