"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { LIVE_REFETCH_INTERVAL_MS } from "@/lib/realtime";
import {
  getConversationAction,
  sendManualMessageAction,
} from "../actions/conversation-actions";
import { MESSAGES_QUERY_KEY } from "./use-messages";

export const CONVERSATION_QUERY_KEY = ["conversation"] as const;

export function useConversation(patientId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...CONVERSATION_QUERY_KEY, patientId],
    queryFn: async () => {
      const result = await getConversationAction(patientId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    // Mesma razão da caixa de entrada: o paciente responde pelo WhatsApp,
    // fora do sistema, e sem reconsulta a resposta só apareceria com F5.
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });

  return {
    entries: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

export function useSendManualMessage(patientId: string) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (body: string) => {
      const result = await sendManualMessageAction(patientId, body);
      if (!result.success) throw new Error(result.message);
      return result.message;
    },
    onSuccess: (message) => {
      snackbar.showSuccess(message);
      queryClient.invalidateQueries({
        queryKey: [...CONVERSATION_QUERY_KEY, patientId],
      });
      // A resposta manual é um envio: aparece no histórico da aba Mensagens
      // (e na de Falhas, se o WhatsApp recusar). A caixa de entrada não muda
      // — lá só entra o que o paciente escreve.
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
