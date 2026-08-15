"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  deleteClinicalPhotoAction,
  getClinicalPhotosAction,
  uploadClinicalPhotoAction,
} from "../actions/clinical-photos-actions";

export const CLINICAL_PHOTOS_QUERY_KEY = ["clinical-photos"] as const;

/**
 * As URLs vêm assinadas e expiram em ~5 min.
 *
 * `staleTime` curto e sem cache longo de propósito: uma resposta guardada
 * por muito tempo teria links que não abrem mais, e a foto apareceria
 * quebrada sem explicação.
 */
export function useClinicalPhotos(patientId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...CLINICAL_PHOTOS_QUERY_KEY, patientId],
    queryFn: async () => {
      const result = await getClinicalPhotosAction(patientId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    staleTime: 60_000,
    gcTime: 4 * 60_000,
  });

  return {
    photos: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

export function useUploadClinicalPhoto(patientId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await uploadClinicalPhotoAction(formData);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Foto enviada.");
      queryClient.invalidateQueries({
        queryKey: [...CLINICAL_PHOTOS_QUERY_KEY, patientId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}

export function useDeleteClinicalPhoto(patientId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const result = await deleteClinicalPhotoAction(patientId, photoId);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      snackbar.showSuccess("Foto excluída.");
      queryClient.invalidateQueries({
        queryKey: [...CLINICAL_PHOTOS_QUERY_KEY, patientId],
      });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
