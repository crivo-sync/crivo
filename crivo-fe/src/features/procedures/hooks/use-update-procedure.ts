"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putProcedureAction } from "../actions/put-procedure-action";
import { PROCEDURES_QUERY_KEY } from "./use-procedures";
import type { UpdateProcedureSchema } from "../schemas/procedure";

export function useUpdateProcedure() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateProcedureSchema;
    }) => {
      const result = await putProcedureAction(id, input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Procedimento atualizado.");
      queryClient.invalidateQueries({ queryKey: PROCEDURES_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
