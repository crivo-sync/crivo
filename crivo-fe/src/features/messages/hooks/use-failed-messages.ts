"use client";

import { useQuery } from "@tanstack/react-query";

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
