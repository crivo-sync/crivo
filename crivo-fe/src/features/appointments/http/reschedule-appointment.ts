import { api, authHeaders } from "@/config/api";
import type { RescheduleAppointmentSchema } from "../schemas/appointment";

export async function rescheduleAppointment(
  id: string,
  input: RescheduleAppointmentSchema,
  accessToken: string,
): Promise<void> {
  await api.patch(`appointments/${id}/reschedule`, {
    json: input,
    headers: authHeaders(accessToken),
  });
}
