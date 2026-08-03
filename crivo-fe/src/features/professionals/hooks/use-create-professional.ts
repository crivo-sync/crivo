"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { postProfessionalAction } from "../actions/post-professional-action";
import { PROFESSIONALS_QUERY_KEY } from "./use-professionals";
import type { CreateProfessionalSchema } from "../schemas/professional";

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: CreateProfessionalSchema) => {
      const result = await postProfessionalAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Profissional cadastrado.");
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
