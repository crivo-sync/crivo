"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getProfessionals } from "../http/get-professionals";
import type { ProfessionalsQueryParams } from "../schemas/professionals-query-params";
import type { ActionResult, PaginatedResponse, Professional } from "../types";

export async function getProfessionalsAction(
  params: ProfessionalsQueryParams,
): Promise<ActionResult<PaginatedResponse<Professional>>> {
  // Leitura é liberada para qualquer papel — o backend não usa @Roles no GET.
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getProfessionals(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Professionals Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
