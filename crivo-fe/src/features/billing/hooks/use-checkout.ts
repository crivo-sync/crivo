"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { TENANT_QUERY_KEY } from "@/features/tenant/hooks/use-tenant";
import { createCheckoutSessionAction } from "../actions/create-checkout-session-action";

/**
 * `loadingPlanId` (não um booleano solto) porque a tela mostra vários
 * botões de plano ao mesmo tempo — sem isso, clicar num travaria o
 * carregando de todos os outros também.
 */
export function useCheckout() {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();

  const startCheckout = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const result = await createCheckoutSessionAction(planId);
      if (!result.success) {
        snackbar.showError(result.message);
        return;
      }

      // Quem já tem assinatura não passa pelo checkout: o backend troca o
      // preço da assinatura existente e devolve o que aconteceu. Mandar para
      // o Stripe nesse caso criaria uma segunda assinatura ativa, cobrando
      // as duas.
      if (result.data.kind === "changed") {
        snackbar.showSuccess(result.data.message);
        // O plano mudou: recarrega o tenant para as travas de feature e o
        // "Plano contratado" refletirem a troca sem F5.
        await queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEY });
        return;
      }

      // Primeira assinatura: sai da aplicação de propósito.
      window.location.href = result.data.url;
    } finally {
      setLoadingPlanId(null);
    }
  };

  return { startCheckout, loadingPlanId };
}
