import { api, authHeaders } from "@/config/api";
import type { MessageUsage } from "../types";

export async function getMessageUsage(
  accessToken: string,
): Promise<MessageUsage> {
  return api
    .get("billing/usage", { headers: authHeaders(accessToken) })
    .json<MessageUsage>();
}
