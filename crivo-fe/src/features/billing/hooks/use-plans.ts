"use client";

import { useQuery } from "@tanstack/react-query";

import { getPlansAction } from "../actions/get-plans-action";

export const PLANS_QUERY_KEY = ["plans"] as const;

export function usePlans() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: async () => {
      const result = await getPlansAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return {
    plans: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
