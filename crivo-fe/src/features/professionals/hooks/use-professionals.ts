"use client";

import { useQuery } from "@tanstack/react-query";

import { getProfessionalsAction } from "../actions/get-professionals-action";
import type { ProfessionalsQueryParams } from "../schemas/professionals-query-params";

export const PROFESSIONALS_QUERY_KEY = ["professionals"] as const;

export function useProfessionals(params: ProfessionalsQueryParams) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...PROFESSIONALS_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getProfessionalsAction(params);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    professionals: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
