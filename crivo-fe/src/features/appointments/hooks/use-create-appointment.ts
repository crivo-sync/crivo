"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
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
    onSuccess: () => {
      snackbar.showSuccess("Agendamento criado.");
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
