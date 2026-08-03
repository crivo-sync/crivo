import { api, authHeaders } from "@/config/api";
import type { Tenant } from "../types";
import type { UpdateTenantSchema } from "../schemas/tenant";

export async function putTenant(
  input: UpdateTenantSchema,
  accessToken: string,
): Promise<Tenant> {
  return api
    .patch("tenants/me", { json: input, headers: authHeaders(accessToken) })
    .json<Tenant>();
}
