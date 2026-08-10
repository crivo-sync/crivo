"use client";

import { useQuery } from "@tanstack/react-query";

import { getSlotCandidatesAction } from "../actions/waitlist-actions";

export function useSlotCandidates(appointmentId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["waitlist", "candidates", appointmentId],
    queryFn: async () => {
      const result = await getSlotCandidatesAction(appointmentId!);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    // Só busca quando há uma vaga concreta — o dialog monta com `undefined`
    // enquanto nenhum agendamento foi cancelado.
    enabled: !!appointmentId,
  });

  return {
    candidates: data?.candidates ?? [],
    slot: data?.slot,
    isLoading,
    error: error as Error | null,
  };
}
