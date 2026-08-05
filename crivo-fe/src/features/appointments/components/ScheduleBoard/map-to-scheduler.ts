import type { SchedulerEvent, SchedulerResource } from "@mui/x-scheduler/models";

import type { Professional } from "@/features/professionals/types";
import type { Appointment } from "../../types";
import { colorForIndex } from "./colors";

export function professionalsToResources(
  professionals: Professional[],
): SchedulerResource[] {
  return professionals.map((professional, index) => ({
    id: professional.id,
    title: professional.name,
    eventColor: colorForIndex(index),
  }));
}

/**
 * CANCELLED e NO_SHOW não ocupam a agenda — mesma regra do backend
 * (`get-availability.use-case.ts`). Mostrar esses agendamentos no quadro
 * criaria um bloco "ocupado" num horário que na prática está livre para
 * marcar, o oposto do que esta tela existe para responder.
 */
const OCCUPYING_STATUSES = new Set<Appointment["status"]>([
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
]);

export function appointmentsToEvents(
  appointments: Appointment[],
): SchedulerEvent[] {
  return appointments
    .filter((appointment) => OCCUPYING_STATUSES.has(appointment.status))
    .map((appointment) => ({
      id: appointment.id,
      title:
        appointment.status === "SCHEDULED"
          ? `${appointment.patient.name} · ${appointment.procedure.name} (não confirmado)`
          : `${appointment.patient.name} · ${appointment.procedure.name}`,
      start: appointment.startsAt,
      end: appointment.endsAt,
      resource: appointment.professional.id,
      readOnly: true,
    }));
}
