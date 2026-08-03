"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getPatients } from "../http/get-patients";
import type { PatientsQueryParams } from "../schemas/patients-query-params";
import type { ActionResult, PaginatedResponse, Patient } from "../types";

export async function getPatientsAction(
  params: PatientsQueryParams,
): Promise<ActionResult<PaginatedResponse<Patient>>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getPatients(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Patients Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
