"use client";

import { useQuery } from "@tanstack/react-query";

import { LIVE_REFETCH_INTERVAL_MS } from "@/config/realtime";
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
    // O paciente confirma pelo WhatsApp, fora do painel — sem isso a
    // recepção só veria "Agendado" virar "Confirmado" ao dar F5.
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });

  return {
    appointments: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
