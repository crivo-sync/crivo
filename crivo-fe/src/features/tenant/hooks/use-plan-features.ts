"use client";

import { useTenant } from "./use-tenant";
import type { PlanFeatures } from "../types";

/** Nome das features booleanas do plano. */
export type PlanFeature = {
  [K in keyof PlanFeatures]: PlanFeatures[K] extends boolean ? K : never;
}[keyof PlanFeatures];

/**
 * O que o plano contratado libera.
 *
 * **Trial libera tudo** (`plan: null`): é assim que a clínica experimenta os
 * recursos antes de escolher — mesma regra do `PlanFeatureGuard` no backend.
 *
 * Enquanto o tenant carrega, também libera. Esconder por padrão faria menu e
 * abas piscarem a cada navegação, e o custo de errar para o lado permissivo é
 * baixo: o backend recusa de qualquer forma.
 *
 * **Isto não é segurança.** Serve para não oferecer o que vai dar 403 numa
 * tela vazia — quem protege o dado é o guard no crivo-be.
 */
export function usePlanFeatures() {
  const { tenant, isLoading } = useTenant();

  const plan = tenant?.plan ?? null;

  const has = (feature: PlanFeature): boolean => {
    if (isLoading || !tenant) return true;
    if (!plan) return true;
    return plan[feature];
  };

  return {
    has,
    /** Nome do plano, para dizer na tela o que precisa de upgrade. */
    planName: plan?.name ?? null,
    /** `true` em trial — a clínica ainda não escolheu plano. */
    isTrial: !plan,
    isLoading,
  };
}
