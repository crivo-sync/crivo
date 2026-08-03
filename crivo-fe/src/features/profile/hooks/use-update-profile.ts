"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putProfileAction } from "../actions/put-profile-action";
import { PROFILE_QUERY_KEY } from "./use-profile";
import type { UpdateProfileSchema } from "../schemas/profile";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: UpdateProfileSchema) => {
      const result = await putProfileAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Perfil atualizado.");
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
