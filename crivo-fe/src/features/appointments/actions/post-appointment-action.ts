"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { postAppointment } from "../http/post-appointment";
import {
  createAppointmentSchema,
  type CreateAppointmentSchema,
} from "../schemas/appointment";
import type { ActionResult } from "../types";

export async function postAppointmentAction(
  input: CreateAppointmentSchema,
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    await postAppointment(parsed.data, session.accessToken);
    return { success: true, message: "Agendamento criado.", data: undefined };
  } catch (error) {
    console.error("[Post Appointment Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível criar o agendamento.",
    };
  }
}
