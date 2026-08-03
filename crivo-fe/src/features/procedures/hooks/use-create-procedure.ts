"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { postProcedureAction } from "../actions/post-procedure-action";
import { PROCEDURES_QUERY_KEY } from "./use-procedures";
import type { CreateProcedureSchema } from "../schemas/procedure";

export function useCreateProcedure() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: CreateProcedureSchema) => {
      const result = await postProcedureAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Procedimento cadastrado.");
      queryClient.invalidateQueries({ queryKey: PROCEDURES_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
