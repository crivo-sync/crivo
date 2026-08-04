"use client";

import { useQuery } from "@tanstack/react-query";

import { LIVE_REFETCH_INTERVAL_MS } from "@/config/realtime";
import { getFailedMessagesAction } from "../actions/get-failed-messages-action";

export const FAILED_MESSAGES_QUERY_KEY = ["messages", "failed"] as const;

export function useFailedMessages(params: { page: number; perPage: number }) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...FAILED_MESSAGES_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getFailedMessagesAction(params);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    placeholderData: (previousData) => previousData,
    // Uma falha nasce ~3min30 depois do envio (fim do retry) — é o dado que
    // menos pode chegar atrasado na tela da recepção.
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
