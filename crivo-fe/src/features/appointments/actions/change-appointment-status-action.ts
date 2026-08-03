"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { changeAppointmentStatus } from "../http/change-appointment-status";
import {
  changeAppointmentStatusSchema,
  type ChangeAppointmentStatusSchema,
} from "../schemas/appointment";
import type { ActionResult } from "../types";

export async function changeAppointmentStatusAction(
  id: string,
  input: ChangeAppointmentStatusSchema,
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = changeAppointmentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(session.accessToken, (token) =>
      changeAppointmentStatus(id, parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Status atualizado.", data: undefined };
  } catch (error) {
    console.error("[Change Appointment Status Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o status.",
    };
  }
}
