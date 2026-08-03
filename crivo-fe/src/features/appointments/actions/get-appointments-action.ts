"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getAppointments } from "../http/get-appointments";
import type { AppointmentsQueryParams } from "../schemas/appointments-query-params";
import type { ActionResult, Appointment, PaginatedResponse } from "../types";

export async function getAppointmentsAction(
  params: AppointmentsQueryParams,
): Promise<ActionResult<PaginatedResponse<Appointment>>> {
  // Backend não usa @Roles em appointments — ADMIN e STAFF agendam igual.
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getAppointments(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Appointments Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
