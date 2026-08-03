"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
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
    const result = await withAuth(session.accessToken, (token) =>
      postAppointment(parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
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
