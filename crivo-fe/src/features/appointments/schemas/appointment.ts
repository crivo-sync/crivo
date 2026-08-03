import { z } from "zod";

import { validateAppointmentStart } from "../business-hours";

const startsAtField = z
  .string()
  .min(1, "Informe data e hora")
  .superRefine((value, ctx) => {
    const error = validateAppointmentStart(value);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
  });

// Espelha CreateAppointmentDto: duração/preço vêm do procedimento no backend.
export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Selecione um paciente"),
  professionalId: z.string().uuid("Selecione um profissional"),
  procedureId: z.string().uuid("Selecione um procedimento"),
  startsAt: startsAtField,
  notes: z.string().trim().optional().or(z.literal("")),
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
