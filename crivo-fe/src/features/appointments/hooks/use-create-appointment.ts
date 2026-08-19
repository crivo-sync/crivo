"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { WAITLIST_QUERY_KEY } from "@/features/waitlist/hooks/use-waitlist";
import { postAppointmentAction } from "../actions/post-appointment-action";
import { APPOINTMENTS_QUERY_KEY } from "./use-appointments";
import type { CreateAppointmentSchema } from "../schemas/appointment";

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: CreateAppointmentSchema) => {
      const result = await postAppointmentAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: (_data, variables) => {
      snackbar.showSuccess("Agendamento criado.");
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      /**
       * Só quando o agendamento veio de uma vaga da fila: sem isso, criar
       * pelo botão "Agendar" da lista de espera fechava a `WaitlistEntry`
       * no backend (confirmado — vira `SCHEDULED` com `appointmentId`), mas
       * a tela continuava mostrando "Esperando" até a recepção recarregar a
       * página por conta própria.
       */
      if (variables.waitlistEntryId) {
        queryClient.invalidateQueries({ queryKey: WAITLIST_QUERY_KEY });
      }
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
