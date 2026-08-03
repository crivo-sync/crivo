"use client";

import { useMutation } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { changePasswordAction } from "../actions/change-password-action";

export function useChangePassword() {
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const result = await changePasswordAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      snackbar.showSuccess("Senha atualizada.");
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
