"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { changeAppointmentStatusAction } from "../actions/change-appointment-status-action";
import { APPOINTMENTS_QUERY_KEY } from "./use-appointments";
import type { ChangeAppointmentStatusSchema } from "../schemas/appointment";

export function useChangeAppointmentStatus() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ChangeAppointmentStatusSchema;
    }) => {
      const result = await changeAppointmentStatusAction(id, input);
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      snackbar.showSuccess("Status atualizado.");
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
