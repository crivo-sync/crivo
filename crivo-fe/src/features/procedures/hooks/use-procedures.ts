"use client";

import { useQuery } from "@tanstack/react-query";

import { useSessionExpiredGuard } from "@/hooks/use-session-expired-guard";
import { getProceduresAction } from "../actions/get-procedures-action";
import type { ProceduresQueryParams } from "../schemas/procedures-query-params";

export const PROCEDURES_QUERY_KEY = ["procedures"] as const;

export function useProcedures(params: ProceduresQueryParams) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...PROCEDURES_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getProceduresAction(params);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    placeholderData: (previousData) => previousData,
  });

  useSessionExpiredGuard(error);

  return {
    procedures: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
