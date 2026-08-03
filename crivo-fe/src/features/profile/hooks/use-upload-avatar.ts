"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { uploadAvatarAction } from "../actions/upload-avatar-action";
import { PROFILE_QUERY_KEY } from "./use-profile";

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadAvatarAction(file);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Foto atualizada.");
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
