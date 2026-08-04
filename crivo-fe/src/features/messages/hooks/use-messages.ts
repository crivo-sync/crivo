"use client";

import { useQuery } from "@tanstack/react-query";

import { LIVE_REFETCH_INTERVAL_MS } from "@/config/realtime";
import { getMessagesAction } from "../actions/get-messages-action";
import type { MessagesQueryParams } from "../schemas/messages-query-params";

export const MESSAGES_QUERY_KEY = ["messages"] as const;

export function useMessages(params: MessagesQueryParams) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...MESSAGES_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getMessagesAction(params);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    placeholderData: (previousData) => previousData,
    // O envio acontece na fila, em segundo plano: PENDING → SENT/FAILED
    // muda sem nenhuma ação na tela.
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });

  return {
    messages: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
