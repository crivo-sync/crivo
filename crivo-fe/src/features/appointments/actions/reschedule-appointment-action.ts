"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
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
    await rescheduleAppointment(id, parsed.data, session.accessToken);
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
