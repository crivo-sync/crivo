"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { rescheduleAppointment } from "../http/reschedule-appointment";
import {
  rescheduleAppointmentSchema,
  type RescheduleAppointmentSchema,
} from "../schemas/appointment";
import type { ActionResult } from "../types";

export async function rescheduleAppointmentAction(
  id: string,
  input: RescheduleAppointmentSchema,
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = rescheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(session.accessToken, (token) =>
      rescheduleAppointment(id, parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Agendamento reagendado.", data: undefined };
  } catch (error) {
    console.error("[Reschedule Appointment Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível reagendar.",
    };
  }
}
