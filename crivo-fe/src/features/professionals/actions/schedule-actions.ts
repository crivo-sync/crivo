"use server";

import {
  FORBIDDEN_MESSAGE,
  getServerSession,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  deleteTimeOff,
  getSchedule,
  getTimeOff,
  postTimeOff,
  putSchedule,
} from "../http/schedule";
import type { ActionResult, ScheduleWindow, TimeOff } from "../types";

/** Erro de auth traduzido igual em todas as actions deste arquivo. */
function authError(reason: "unauthenticated" | "forbidden") {
  return {
    success: false as const,
    message:
      reason === "forbidden" ? FORBIDDEN_MESSAGE : SESSION_EXPIRED_MESSAGE,
  };
}

// Leitura é liberada: a recepção precisa saber quando cada profissional
// atende para conseguir agendar.
export async function getScheduleAction(
  professionalId: string,
): Promise<ActionResult<ScheduleWindow[]>> {
  const session = await getServerSession();
  if (!session) return authError("unauthenticated");

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getSchedule(professionalId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Schedule Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function putScheduleAction(
  professionalId: string,
  windows: ScheduleWindow[],
): Promise<ActionResult<ScheduleWindow[]>> {
  const auth = await requireAdmin();
  if (!auth.ok) return authError(auth.reason);

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      putSchedule(professionalId, windows, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Horários salvos.", data: result.data };
  } catch (error) {
    console.error("[Put Schedule Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os horários.",
    };
  }
}

export async function getTimeOffAction(
  professionalId: string,
): Promise<ActionResult<TimeOff[]>> {
  const session = await getServerSession();
  if (!session) return authError("unauthenticated");

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getTimeOff(professionalId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Time Off Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function postTimeOffAction(
  professionalId: string,
  input: { startsAt: string; endsAt: string; reason?: string },
): Promise<ActionResult<TimeOff>> {
  const auth = await requireAdmin();
  if (!auth.ok) return authError(auth.reason);

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      postTimeOff(professionalId, input, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Bloqueio criado.", data: result.data };
  } catch (error) {
    console.error("[Post Time Off Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível bloquear o período.",
    };
  }
}

export async function deleteTimeOffAction(
  professionalId: string,
  timeOffId: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return authError(auth.reason);

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      deleteTimeOff(professionalId, timeOffId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Bloqueio removido.", data: undefined };
  } catch (error) {
    console.error("[Delete Time Off Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível remover o bloqueio.",
    };
  }
}
