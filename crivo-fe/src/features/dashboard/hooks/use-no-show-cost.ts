"use client";

import { useQuery } from "@tanstack/react-query";

import { getNoShowCostAction } from "../actions/get-no-show-cost-action";

export const NO_SHOW_COST_QUERY_KEY = ["dashboard", "no-show-cost"] as const;

export function useNoShowCost() {
  const { data, isLoading } = useQuery({
    queryKey: NO_SHOW_COST_QUERY_KEY,
    queryFn: async () => {
      const result = await getNoShowCostAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    staleTime: 60 * 1000,
  });

  return { cost: data, isLoading };
}
