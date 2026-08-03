"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { deleteProcedureAction } from "../actions/delete-procedure-action";
import { PROCEDURES_QUERY_KEY } from "./use-procedures";

export function useDeleteProcedure() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProcedureAction(id);
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      snackbar.showSuccess("Procedimento removido.");
      queryClient.invalidateQueries({ queryKey: PROCEDURES_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
