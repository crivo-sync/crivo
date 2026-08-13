"use client";

import { useQuery } from "@tanstack/react-query";

import { getMessageUsageAction } from "../actions/get-message-usage-action";

export const MESSAGE_USAGE_QUERY_KEY = ["message-usage"] as const;

export function useMessageUsage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: MESSAGE_USAGE_QUERY_KEY,
    queryFn: async () => {
      const result = await getMessageUsageAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return { usage: data, isLoading, error: error as Error | null, refetch };
}
