"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putUserAction } from "../actions/put-user-action";
import { USERS_QUERY_KEY } from "./use-users";
import type { UpdateUserSchema } from "../schemas/user";

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateUserSchema;
    }) => {
      const result = await putUserAction(id, input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Usuário atualizado.");
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
