"use client";

import { useQuery } from "@tanstack/react-query";

import { useSessionExpiredGuard } from "@/hooks/use-session-expired-guard";
import { getAppointmentsAction } from "../actions/get-appointments-action";
import type { AppointmentsQueryParams } from "../schemas/appointments-query-params";

export const APPOINTMENTS_QUERY_KEY = ["appointments"] as const;

export function useAppointments(params: AppointmentsQueryParams) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getAppointmentsAction(params);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    placeholderData: (previousData) => previousData,
  });

  useSessionExpiredGuard(error);

  return {
    appointments: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
