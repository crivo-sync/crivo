"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { postUserAction } from "../actions/post-user-action";
import { USERS_QUERY_KEY } from "./use-users";
import type { CreateUserSchema } from "../schemas/user";

export function useCreateUser() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: CreateUserSchema) => {
      const result = await postUserAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Usuário cadastrado.");
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
