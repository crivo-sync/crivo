import { SetMetadata } from '@nestjs/common';
import type { Plan } from '@prisma/client';

export const PLAN_FEATURE_KEY = 'planFeature';

/**
 * Toda flag booleana de `Plan` — derivado do próprio model em vez de uma
 * união escrita à mão, para que uma flag nova no schema já fique
 * disponível aqui sem alguém precisar lembrar de atualizar esta lista.
 */
export type PlanFeature = {
  [K in keyof Plan]: Plan[K] extends boolean ? K : never;
}[keyof Plan];

/**
 * Restringe a rota (ou o controller inteiro) a planos que incluem a feature
 * informada — um campo booleano de `Plan` (ex: `"hasPrediction"`).
 *
 * Tenant em trial (sem `planId`) sempre passa: o trial libera o produto
 * inteiro, é o que já foi decidido para o cadastro self-service.
 *
 * Exige que `PlanFeatureGuard` esteja aplicado junto do `TenantContextGuard`.
 */
export const RequiresPlanFeature = (feature: PlanFeature) =>
  SetMetadata(PLAN_FEATURE_KEY, feature);
