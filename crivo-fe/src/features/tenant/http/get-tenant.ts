import { api, authHeaders } from "@/config/api";
import type { Tenant } from "../types";

export async function getTenant(accessToken: string): Promise<Tenant> {
  return api
    .get("tenants/me", { headers: authHeaders(accessToken) })
    .json<Tenant>();
}
