import { api, authHeaders } from "@/config/api";
import type { NoShowCost } from "../types";

export async function getNoShowCost(
  accessToken: string,
): Promise<NoShowCost> {
  return api
    .get("dashboard/no-show-cost", { headers: authHeaders(accessToken) })
    .json<NoShowCost>();
}
