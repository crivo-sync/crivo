"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardAnalyticsAction } from "../actions/get-dashboard-analytics-action";

export const DASHBOARD_ANALYTICS_QUERY_KEY = ["dashboard", "analytics"] as const;

export function useDashboardAnalytics(revenueDays?: number) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    // A janela entra na chave: cada período vira uma entrada de cache própria,
    // então voltar para um período já visitado não refaz a busca.
    queryKey: [...DASHBOARD_ANALYTICS_QUERY_KEY, revenueDays ?? "default"],
    queryFn: async () => {
      const result = await getDashboardAnalyticsAction(revenueDays);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 60 * 1000,
    // Mantém o gráfico anterior na tela enquanto o novo período carrega, em
    // vez de piscar o skeleton a cada troca de filtro.
    placeholderData: (previous) => previous,
  });

  return { analytics: data, isLoading, isFetching, error, refetch };
}
