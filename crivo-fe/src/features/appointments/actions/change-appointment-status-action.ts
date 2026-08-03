"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
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
    await changeAppointmentStatus(id, parsed.data, session.accessToken);
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
