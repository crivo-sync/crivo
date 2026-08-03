"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putProfessionalAction } from "../actions/put-professional-action";
import { PROFESSIONALS_QUERY_KEY } from "./use-professionals";
import type { UpdateProfessionalSchema } from "../schemas/professional";

export function useUpdateProfessional() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateProfessionalSchema;
    }) => {
      const result = await putProfessionalAction(id, input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Profissional atualizado.");
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
