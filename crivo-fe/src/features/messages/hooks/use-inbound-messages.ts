"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { LIVE_REFETCH_INTERVAL_MS } from "@/lib/realtime";
import { getInboundMessagesAction } from "../actions/get-inbound-messages-action";
import {
  markAllInboundReadAction,
  markInboundReadAction,
} from "../actions/mark-inbound-read-action";
import type { GetInboundMessagesParams } from "../http/get-inbound-messages";

export const INBOUND_MESSAGES_QUERY_KEY = ["inbound-messages"] as const;

export function useInboundMessages(params: GetInboundMessagesParams) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...INBOUND_MESSAGES_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getInboundMessagesAction(params);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    placeholderData: (previousData) => previousData,
    // O paciente responde pelo WhatsApp, fora do sistema — sem reconsulta a
    // recepção só veria a mensagem nova ao recarregar a página.
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });

  return {
    messages: data?.data ?? [],
    meta: data?.meta,
    unreadTotal: data?.unreadTotal ?? 0,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

export function useMarkInboundRead() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markInboundReadAction(id);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOUND_MESSAGES_QUERY_KEY });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}

export function useMarkAllInboundRead() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async () => {
      const result = await markAllInboundReadAction();
      if (!result.success) throw new Error(result.message);
      return { ...result.data, message: result.message };
    },
    onSuccess: (data) => {
      snackbar.showSuccess(data.message);
      queryClient.invalidateQueries({ queryKey: INBOUND_MESSAGES_QUERY_KEY });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
