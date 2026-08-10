"use client";

import { useQuery } from "@tanstack/react-query";

import { LIVE_REFETCH_INTERVAL_MS } from "@/lib/realtime";
import { getUpcomingRiskAction } from "../actions/get-upcoming-risk-action";

export const UPCOMING_RISK_QUERY_KEY = ["prediction", "no-show"] as const;

export function useUpcomingRisk(params: { days: number; limit?: number }) {
  const query = { days: params.days, limit: params.limit ?? 50 };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...UPCOMING_RISK_QUERY_KEY, query],
    queryFn: async () => {
      const result = await getUpcomingRiskAction(query);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    placeholderData: (previousData) => previousData,
    // O risco cai sozinho quando o paciente confirma pelo WhatsApp — sem
    // reconsulta, a recepção ligaria para quem já respondeu.
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });

  return {
    risks: data?.data ?? [],
    summary: data?.summary ?? { high: 0, medium: 0, low: 0 },
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}
