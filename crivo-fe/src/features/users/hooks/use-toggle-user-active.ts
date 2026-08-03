"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putUserAction } from "../actions/put-user-action";
import { USERS_QUERY_KEY } from "./use-users";

/**
 * Não existe `DELETE /users` — usuários são desativados, nunca excluídos
 * (histórico de auditoria/agendamentos criados por eles precisa sobreviver).
 * "Remover" na UI é sempre `PATCH { isActive: false }`; o mesmo hook serve
 * para reativar.
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const result = await putUserAction(id, { isActive });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: (_, { isActive }) => {
      snackbar.showSuccess(isActive ? "Usuário reativado." : "Usuário desativado.");
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
