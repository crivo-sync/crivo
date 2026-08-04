"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { uploadLogoAction } from "../actions/upload-logo-action";
import { TENANT_QUERY_KEY } from "./use-tenant";

export function useUploadLogo() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadLogoAction(file);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Logo atualizado.");
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
