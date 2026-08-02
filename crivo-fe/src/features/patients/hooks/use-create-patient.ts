"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { postPatientAction } from "../actions/post-patient-action";
import { PATIENTS_QUERY_KEY } from "./use-patients";
import type { CreatePatientSchema } from "../schemas/patient";

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: CreatePatientSchema) => {
      const result = await postPatientAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Paciente cadastrado.");
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
