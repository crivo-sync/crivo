import { z } from "zod";

// O horário só pode vir de um slot que o `GET /appointments/availability`
// já ofereceu — que por sua vez já aplicou expediente, duração do
// procedimento e conflito de agenda. Validar de novo aqui seria duplicar
// (e divergir d) a regra que já mora no backend; só falta garantir que
// algo foi escolhido.
const startsAtField = z.string().min(1, "Escolha um horário");

// Espelha CreateAppointmentDto: duração/preço vêm do procedimento no backend.
export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Selecione um paciente"),
  professionalId: z.string().uuid("Selecione um profissional"),
  procedureId: z.string().uuid("Selecione um procedimento"),
  startsAt: startsAtField,
  notes: z.string().trim().optional().or(z.literal("")),
  /**
   * Fecha o item da lista de espera junto com este agendamento. Nenhum
   * campo do formulário edita isto — só é setado programaticamente quando
   * o dialog abre a partir do botão "Agendar" na fila de espera.
   */
  waitlistEntryId: z.string().uuid().optional(),
});

export type CreateAppointmentSchema = z.infer<typeof createAppointmentSchema>;

// Espelha RescheduleAppointmentDto.
export const rescheduleAppointmentSchema = z.object({
  startsAt: startsAtField,
  professionalId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type RescheduleAppointmentSchema = z.infer<
  typeof rescheduleAppointmentSchema
>;

// Espelha ChangeAppointmentStatusDto.
export const changeAppointmentStatusSchema = z.object({
  status: z.enum([
    "SCHEDULED",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  cancelReason: z.string().trim().optional().or(z.literal("")),
});

export type ChangeAppointmentStatusSchema = z.infer<
  typeof changeAppointmentStatusSchema
>;
