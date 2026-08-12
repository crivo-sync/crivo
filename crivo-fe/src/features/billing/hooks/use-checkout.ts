"use client";

import { useState } from "react";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import { createCheckoutSessionAction } from "../actions/create-checkout-session-action";

/**
 * `loadingPlanId` (não um booleano solto) porque a tela mostra vários
 * botões de plano ao mesmo tempo — sem isso, clicar num travaria o
 * carregando de todos os outros também.
 */
export function useCheckout() {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const snackbar = useSnackbar();

  const startCheckout = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const result = await createCheckoutSessionAction(planId);
      if (!result.success) {
        snackbar.showError(result.message);
        return;
      }
      // Redireciona para o Stripe Checkout — sai da aplicação de propósito,
      // não é uma navegação client-side.
      window.location.href = result.data.url;
    } finally {
      setLoadingPlanId(null);
    }
  };

  return { startCheckout, loadingPlanId };
}
