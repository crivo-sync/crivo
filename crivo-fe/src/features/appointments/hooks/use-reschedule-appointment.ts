"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { rescheduleAppointmentAction } from "../actions/reschedule-appointment-action";
import { APPOINTMENTS_QUERY_KEY } from "./use-appointments";
import type { RescheduleAppointmentSchema } from "../schemas/appointment";

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: RescheduleAppointmentSchema;
    }) => {
      const result = await rescheduleAppointmentAction(id, input);
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      snackbar.showSuccess("Agendamento reagendado.");
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
