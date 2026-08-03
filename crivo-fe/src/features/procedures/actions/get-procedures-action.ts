"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { getProcedures } from "../http/get-procedures";
import type { ProceduresQueryParams } from "../schemas/procedures-query-params";
import type { ActionResult, PaginatedResponse, Procedure } from "../types";

export async function getProceduresAction(
  params: ProceduresQueryParams,
): Promise<ActionResult<PaginatedResponse<Procedure>>> {
  // Leitura é liberada para qualquer papel — o backend não usa @Roles no GET.
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const data = await getProcedures(params, session.accessToken);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Procedures Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
