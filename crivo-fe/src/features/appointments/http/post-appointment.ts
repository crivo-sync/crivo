import { api, authHeaders } from "@/config/api";
import type { CreateAppointmentSchema } from "../schemas/appointment";

export async function postAppointment(
  input: CreateAppointmentSchema,
  accessToken: string,
): Promise<void> {
  await api.post("appointments", {
    json: input,
    headers: authHeaders(accessToken),
  });
}
