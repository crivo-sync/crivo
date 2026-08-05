"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { importPatientsAction } from "../actions/import-patients-action";
import { PATIENTS_QUERY_KEY } from "./use-patients";
import type { ImportResult } from "../types";

type ImportInput = { file: File; dryRun: boolean };

export function useImportPatients() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async ({ file, dryRun }: ImportInput): Promise<ImportResult> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", String(dryRun));

      const result = await importPatientsAction(formData);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: (result) => {
      // A prévia não altera nada: avisar "importado" ali seria mentira, e
      // invalidar a lista só geraria refetch à toa.
      if (result.dryRun) return;

      snackbar.showSuccess(
        result.created === 1
          ? "1 paciente importado."
          : `${result.created} pacientes importados.`,
      );
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
