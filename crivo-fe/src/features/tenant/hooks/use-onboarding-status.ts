"use client";

import { useQuery } from "@tanstack/react-query";

import { getOnboardingStatusAction } from "../actions/get-onboarding-status-action";

export const ONBOARDING_STATUS_QUERY_KEY = ["onboarding-status"] as const;

export function useOnboardingStatus() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ONBOARDING_STATUS_QUERY_KEY,
    queryFn: async () => {
      const result = await getOnboardingStatusAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return {
    status: data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
