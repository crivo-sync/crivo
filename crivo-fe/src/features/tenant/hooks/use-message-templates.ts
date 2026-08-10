"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  getMessageTemplatesAction,
  putMessageTemplateAction,
} from "../actions/message-templates-action";
import type { SaveTemplateInput } from "../types/templates";

export const MESSAGE_TEMPLATES_QUERY_KEY = ["message-templates"] as const;

export function useMessageTemplates(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: MESSAGE_TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      const result = await getMessageTemplatesAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled,
  });

  return {
    templates: data?.templates ?? [],
    placeholders: data?.placeholders ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

export function useSaveMessageTemplate() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (input: SaveTemplateInput) => {
      const result = await putMessageTemplateAction(input);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      snackbar.showSuccess("Texto da mensagem salvo.");
      queryClient.invalidateQueries({ queryKey: MESSAGE_TEMPLATES_QUERY_KEY });
    },
    // O backend recusa template sem `{{data}}`/`{{hora}}`/`{{link}}` com uma
    // mensagem que já explica o porquê — repassar é mais útil que um texto
    // genérico nosso.
    onError: (error) => snackbar.showError(error.message),
  });
}
