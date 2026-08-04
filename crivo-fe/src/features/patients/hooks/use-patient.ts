"use client";

import { useQuery } from "@tanstack/react-query";

import { getPatientAction } from "../actions/get-patient-action";

export const PATIENT_QUERY_KEY = ["patient"] as const;

export function usePatient(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...PATIENT_QUERY_KEY, id],
    queryFn: async () => {
      const result = await getPatientAction(id);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  return { patient: data, isLoading, error, refetch };
}
