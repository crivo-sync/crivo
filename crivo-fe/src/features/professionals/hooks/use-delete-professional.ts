"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { deleteProfessionalAction } from "../actions/delete-professional-action";
import { PROFESSIONALS_QUERY_KEY } from "./use-professionals";

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProfessionalAction(id);
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      snackbar.showSuccess("Profissional removido.");
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
