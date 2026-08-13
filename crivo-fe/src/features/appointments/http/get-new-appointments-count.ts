import { api, authHeaders } from "@/config/api";

export async function getNewAppointmentsCount(
  since: string,
  accessToken: string,
): Promise<{ count: number }> {
  return api
    .get("appointments/new-count", {
      headers: authHeaders(accessToken),
      searchParams: { since },
    })
    .json<{ count: number }>();
}
