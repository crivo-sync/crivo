"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardAnalyticsAction } from "../actions/get-dashboard-analytics-action";

export const DASHBOARD_ANALYTICS_QUERY_KEY = ["dashboard", "analytics"] as const;

export function useDashboardAnalytics() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: DASHBOARD_ANALYTICS_QUERY_KEY,
    queryFn: async () => {
      const result = await getDashboardAnalyticsAction();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 60 * 1000,
  });

  return { analytics: data, isLoading, error, refetch };
}
