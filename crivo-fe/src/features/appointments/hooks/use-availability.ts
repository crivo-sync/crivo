"use client";

import { useQuery } from "@tanstack/react-query";

import { getAvailabilityAction } from "../actions/get-availability-action";

type UseAvailabilityParams = {
  professionalId?: string;
  procedureId?: string;
  /** `YYYY-MM-DD` em hora local. */
  date?: string;
  excludeAppointmentId?: string;
};

export function useAvailability({
  professionalId,
  procedureId,
  date,
  excludeAppointmentId,
}: UseAvailabilityParams) {
  // Sem profissional, procedimento e dia não há o que perguntar — a duração
  // vem do procedimento e é ela que define o tamanho de cada horário.
  const enabled = !!professionalId && !!procedureId && !!date;

  const { data, isFetching, error } = useQuery({
    queryKey: [
      "appointments",
      "availability",
      professionalId,
      procedureId,
      date,
      excludeAppointmentId ?? null,
    ],
    queryFn: async () => {
      const result = await getAvailabilityAction({
        professionalId: professionalId!,
        procedureId: procedureId!,
        date: date!,
        excludeAppointmentId,
      });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled,
    // A agenda muda com o que outras recepcionistas fazem: sem cache longo,
    // para não oferecer um horário que acabou de ser ocupado.
    staleTime: 0,
  });

  return { availability: data, isFetching, error, enabled };
}
