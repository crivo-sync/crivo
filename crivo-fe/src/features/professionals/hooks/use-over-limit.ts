"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  getOverLimitStatusAction,
  resolveOverLimitAction,
} from "../actions/over-limit-actions";
import { PROFESSIONALS_QUERY_KEY } from "./use-professionals";

export const OVER_LIMIT_QUERY_KEY = ["professionals", "over-limit"] as const;

export function useOverLimitStatus() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: OVER_LIMIT_QUERY_KEY,
    queryFn: async () => {
      const result = await getOverLimitStatusAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return { status: data, isLoading, refetch };
}

export function useResolveOverLimit() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (keepProfessionalIds: string[]) => {
      const result = await resolveOverLimitAction(keepProfessionalIds);
      if (!result.success) throw new Error(result.message);
      return result.message;
    },
    /**
     * Invalida a listagem junto com o status: desativar muda quem aparece
     * como ativo na tabela. Sem isto, a clínica resolveria o excedente e
     * continuaria vendo a lista antiga, sem entender se funcionou.
     */
    onSuccess: (message) => {
      snackbar.showSuccess(message);
      queryClient.invalidateQueries({ queryKey: OVER_LIMIT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFESSIONALS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
