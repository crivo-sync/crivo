import { SubscriptionStatus } from '@prisma/client';

/**
 * Traduz o status cru do Stripe para o enum do domínio. Fallback seguro:
 * qualquer status desconhecido vira `PAST_DUE` (nunca concede acesso por
 * engano quando algo muda na API do Stripe sem a gente notar).
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    unpaid: SubscriptionStatus.PAST_DUE,
    paused: SubscriptionStatus.PAST_DUE,
    incomplete: SubscriptionStatus.PAST_DUE,
    incomplete_expired: SubscriptionStatus.CANCELED,
    canceled: SubscriptionStatus.CANCELED,
  };

  return map[stripeStatus] ?? SubscriptionStatus.PAST_DUE;
}
