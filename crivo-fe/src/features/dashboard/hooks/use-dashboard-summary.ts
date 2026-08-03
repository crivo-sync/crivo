"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardSummaryAction } from "../actions/get-dashboard-summary-action";

export const DASHBOARD_SUMMARY_QUERY_KEY = ["dashboard", "summary"] as const;

export function useDashboardSummary() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
    queryFn: async () => {
      const result = await getDashboardSummaryAction();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    // Home do painel: dados mudam ao longo do dia (novos agendamentos,
    // mensagens falhando), vale revalidar mais cedo que o padrão de 30s.
    staleTime: 15 * 1000,
  });

  return { summary: data, isLoading, error, refetch };
}
