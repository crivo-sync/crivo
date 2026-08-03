import { z } from "zod";

// Espelha QueryAppointmentsDto do crivo-be.
export const appointmentsQueryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(200).default(50),
  from: z.string().optional(),
  to: z.string().optional(),
  professionalId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
});

export type AppointmentsQueryParams = z.infer<
  typeof appointmentsQueryParamsSchema
>;
