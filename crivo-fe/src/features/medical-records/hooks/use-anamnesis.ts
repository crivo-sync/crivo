"use client";

import { useQuery } from "@tanstack/react-query";

import { getAnamnesisAction } from "../actions/get-anamnesis-action";

export const ANAMNESIS_QUERY_KEY = ["anamnesis"] as const;

export function useAnamnesis(patientId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...ANAMNESIS_QUERY_KEY, patientId],
    queryFn: async () => {
      const result = await getAnamnesisAction(patientId);
      if (!result.success) throw new Error(result.message);
      // `null` = ficha ainda não preenchida; a tela abre o form vazio.
      return result.data;
    },
  });

  return { anamnesis: data ?? null, isLoading, error, refetch };
}
