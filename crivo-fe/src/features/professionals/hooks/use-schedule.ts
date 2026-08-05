"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  deleteTimeOffAction,
  getScheduleAction,
  getTimeOffAction,
  postTimeOffAction,
  putScheduleAction,
} from "../actions/schedule-actions";
import type { ScheduleWindow } from "../types";

export const SCHEDULE_QUERY_KEY = ["professional-schedule"] as const;
export const TIME_OFF_QUERY_KEY = ["professional-time-off"] as const;

export function useSchedule(professionalId: string, enabled = true) {
  const { data, isLoading, error } = useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, professionalId],
    queryFn: async () => {
      const result = await getScheduleAction(professionalId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled,
  });

  return { windows: data ?? [], isLoading, error };
}

export function useSaveSchedule(professionalId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (windows: ScheduleWindow[]) => {
      const result = await putScheduleAction(professionalId, windows);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Horários salvos.");
      queryClient.invalidateQueries({
        queryKey: [...SCHEDULE_QUERY_KEY, professionalId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}

export function useTimeOff(professionalId: string, enabled = true) {
  const { data, isLoading, error } = useQuery({
    queryKey: [...TIME_OFF_QUERY_KEY, professionalId],
    queryFn: async () => {
      const result = await getTimeOffAction(professionalId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled,
  });

  return { timeOff: data ?? [], isLoading, error };
}

export function useAddTimeOff(professionalId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: {
      startsAt: string;
      endsAt: string;
      reason?: string;
    }) => {
      const result = await postTimeOffAction(professionalId, input);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Bloqueio criado.");
      queryClient.invalidateQueries({
        queryKey: [...TIME_OFF_QUERY_KEY, professionalId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}

export function useRemoveTimeOff(professionalId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (timeOffId: string) => {
      const result = await deleteTimeOffAction(professionalId, timeOffId);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      snackbar.showSuccess("Bloqueio removido.");
      queryClient.invalidateQueries({
        queryKey: [...TIME_OFF_QUERY_KEY, professionalId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
