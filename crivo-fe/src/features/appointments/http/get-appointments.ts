import { api, authHeaders } from "@/config/api";
import type { Appointment, PaginatedResponse } from "../types";
import type { AppointmentsQueryParams } from "../schemas/appointments-query-params";

export async function getAppointments(
  params: AppointmentsQueryParams,
  accessToken: string,
): Promise<PaginatedResponse<Appointment>> {
  return api
    .get("appointments", {
      headers: authHeaders(accessToken),
      searchParams: {
        page: params.page,
        perPage: params.perPage,
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
        ...(params.professionalId
          ? { professionalId: params.professionalId }
          : {}),
        ...(params.patientId ? { patientId: params.patientId } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    })
    .json<PaginatedResponse<Appointment>>();
}
