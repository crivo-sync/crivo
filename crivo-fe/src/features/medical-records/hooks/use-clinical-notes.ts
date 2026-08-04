"use client";

import { useQuery } from "@tanstack/react-query";

import { getClinicalNotesAction } from "../actions/get-clinical-notes-action";

export const CLINICAL_NOTES_QUERY_KEY = ["clinical-notes"] as const;

export function useClinicalNotes(
  patientId: string,
  params: { page: number; perPage: number },
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...CLINICAL_NOTES_QUERY_KEY, patientId, params],
    queryFn: async () => {
      const result = await getClinicalNotesAction(patientId, params);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    notes: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
