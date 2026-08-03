"use client";

import { useQuery } from "@tanstack/react-query";

import { getPatientsAction } from "@/features/patients/actions/get-patients-action";
import { getProfessionalsAction } from "@/features/professionals/actions/get-professionals-action";
import { getProceduresAction } from "@/features/procedures/actions/get-procedures-action";

/**
 * Opções para os selects do formulário de agendamento. `perPage: 100` é
 * suficiente para o volume de uma clínica única — se algum tenant crescer
 * além disso, os selects viram autocomplete com busca no servidor.
 */
export function useAppointmentFormOptions() {
  const patients = useQuery({
    queryKey: ["appointment-form-options", "patients"],
    queryFn: async () => {
      const result = await getPatientsAction({ page: 1, perPage: 100 });
      if (!result.success) throw new Error(result.message);
      return result.data.data;
    },
  });

  const professionals = useQuery({
    queryKey: ["appointment-form-options", "professionals"],
    queryFn: async () => {
      const result = await getProfessionalsAction({ page: 1, perPage: 100 });
      if (!result.success) throw new Error(result.message);
      return result.data.data.filter((p) => p.isActive);
    },
  });

  const procedures = useQuery({
    queryKey: ["appointment-form-options", "procedures"],
    queryFn: async () => {
      const result = await getProceduresAction({ page: 1, perPage: 100 });
      if (!result.success) throw new Error(result.message);
      return result.data.data.filter((p) => p.isActive);
    },
  });

  return {
    patients: patients.data ?? [],
    professionals: professionals.data ?? [],
    procedures: procedures.data ?? [],
    isLoading:
      patients.isLoading || professionals.isLoading || procedures.isLoading,
  };
}
