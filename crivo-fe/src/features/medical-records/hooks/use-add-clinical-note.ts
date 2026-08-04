"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { postClinicalNoteAction } from "../actions/post-clinical-note-action";
import type { ClinicalNoteFormSchema } from "../schemas/medical-record";
import { CLINICAL_NOTES_QUERY_KEY } from "./use-clinical-notes";

export function useAddClinicalNote(patientId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: ClinicalNoteFormSchema) => {
      const result = await postClinicalNoteAction(patientId, input);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Evolução registrada.");
      queryClient.invalidateQueries({
        queryKey: [...CLINICAL_NOTES_QUERY_KEY, patientId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
