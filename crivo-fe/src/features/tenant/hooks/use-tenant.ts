"use client";

import { useQuery } from "@tanstack/react-query";

import { useSessionExpiredGuard } from "@/hooks/use-session-expired-guard";
import { getTenantAction } from "../actions/get-tenant-action";

export const TENANT_QUERY_KEY = ["tenant"] as const;

export function useTenant() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: TENANT_QUERY_KEY,
    queryFn: async () => {
      const result = await getTenantAction();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  useSessionExpiredGuard(error);

  return { tenant: data, isLoading, isFetching, error, refetch };
}
