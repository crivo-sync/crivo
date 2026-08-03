"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { putTenantAction } from "../actions/put-tenant-action";
import { TENANT_QUERY_KEY } from "./use-tenant";
import type { UpdateTenantSchema } from "../schemas/tenant";

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: UpdateTenantSchema) => {
      const result = await putTenantAction(input);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Dados da clínica atualizados.");
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEY });
    },
    onError: (error) => {
      snackbar.showError(error.message);
    },
  });
}
