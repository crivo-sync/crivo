"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { putTenant } from "../http/put-tenant";
import { updateTenantSchema, type UpdateTenantSchema } from "../schemas/tenant";
import type { ActionResult, Tenant } from "../types";

export async function putTenantAction(
  input: UpdateTenantSchema,
): Promise<ActionResult<Tenant>> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return {
      success: false,
      message:
        auth.reason === "forbidden"
          ? FORBIDDEN_MESSAGE
          : SESSION_EXPIRED_MESSAGE,
    };
  }

  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  // Campos vazios ("") não devem virar string vazia na API — omite.
  const cleaned = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== ""),
  );

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      putTenant(cleaned, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Dados da clínica atualizados.", data: result.data };
  } catch (error) {
    console.error("[Put Tenant Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os dados da clínica.",
    };
  }
}
