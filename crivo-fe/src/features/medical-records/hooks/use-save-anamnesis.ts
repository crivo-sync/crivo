"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putAnamnesisAction } from "../actions/put-anamnesis-action";
import type { AnamnesisFormSchema } from "../schemas/medical-record";
import { ANAMNESIS_QUERY_KEY } from "./use-anamnesis";

export function useSaveAnamnesis(patientId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: AnamnesisFormSchema) => {
      const result = await putAnamnesisAction(patientId, input);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Ficha salva.");
      queryClient.invalidateQueries({
        queryKey: [...ANAMNESIS_QUERY_KEY, patientId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
