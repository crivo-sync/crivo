"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { resendMessageAction } from "../actions/resend-message-action";
import { MESSAGES_QUERY_KEY } from "./use-messages";

export function useResendMessage() {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await resendMessageAction(id);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      snackbar.showSuccess(
        "Mensagem devolvida à fila. O envio acontece em instantes.",
      );
      // `FAILED_MESSAGES_QUERY_KEY` é `["messages", "failed"]`, então
      // invalidar por `["messages"]` atinge o histórico e a aba de falhas de
      // uma vez — a mensagem precisa sumir da segunda ao voltar para PENDING.
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY });
    },
    onError: (error) => snackbar.showError(error.message),
  });
}
