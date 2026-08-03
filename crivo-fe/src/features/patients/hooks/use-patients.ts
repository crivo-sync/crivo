"use client";

import { useQuery } from "@tanstack/react-query";

import { useSessionExpiredGuard } from "@/hooks/use-session-expired-guard";
import { getPatientsAction } from "../actions/get-patients-action";
import type { PatientsQueryParams } from "../schemas/patients-query-params";

export const PATIENTS_QUERY_KEY = ["patients"] as const;

export function usePatients(params: PatientsQueryParams) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...PATIENTS_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getPatientsAction(params);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    placeholderData: (previousData) => previousData,
  });

  useSessionExpiredGuard(error);

  return {
    patients: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
