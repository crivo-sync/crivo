"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";

import { putPatientAction } from "../actions/put-patient-action";
import { PATIENTS_QUERY_KEY } from "./use-patients";
import type { UpdatePatientSchema } from "../schemas/patient";

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePatientSchema }) => {
      const result = await putPatientAction(id, input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Paciente atualizado.");
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
