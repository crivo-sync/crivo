import { api, authHeaders } from "@/config/api";
import type { ChangeAppointmentStatusSchema } from "../schemas/appointment";

export async function changeAppointmentStatus(
  id: string,
  input: ChangeAppointmentStatusSchema,
  accessToken: string,
): Promise<void> {
  await api.patch(`appointments/${id}/status`, {
    json: input,
    headers: authHeaders(accessToken),
  });
}
