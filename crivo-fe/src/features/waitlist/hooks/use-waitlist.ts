"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  addToWaitlistAction,
  getWaitlistAction,
  markWaitlistOfferedAction,
  removeFromWaitlistAction,
} from "../actions/waitlist-actions";
import type { AddToWaitlistInput } from "../types";

export const WAITLIST_QUERY_KEY = ["waitlist"] as const;

export function useWaitlist() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: WAITLIST_QUERY_KEY,
    queryFn: async () => {
      const result = await getWaitlistAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return {
    entries: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/** As três mutations compartilham o mesmo pós-processamento. */
function useWaitlistMutation<TInput>(
  run: (input: TInput) => Promise<{ success: boolean; message: string }>,
) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: TInput) => {
      const result = await run(input);
      if (!result.success) throw new Error(result.message);
      return result.message;
    },
    onSuccess: (message) => {
      snackbar.showSuccess(message);
      queryClient.invalidateQueries({ queryKey: WAITLIST_QUERY_KEY });
    },
    // O backend recusa duplicata com uma mensagem que já explica o motivo —
    // repassar é mais útil que um texto genérico nosso.
    onError: (error) => snackbar.showError(error.message),
  });
}

export const useAddToWaitlist = () =>
  useWaitlistMutation<AddToWaitlistInput>(addToWaitlistAction);

export const useMarkWaitlistOffered = () =>
  useWaitlistMutation<{ id: string; appointmentId?: string }>(
    markWaitlistOfferedAction,
  );

export const useRemoveFromWaitlist = () =>
  useWaitlistMutation<string>(removeFromWaitlistAction);
