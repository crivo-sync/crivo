import { planFeatureLines } from "@/features/billing/plan-features";
import type { Plan } from "@/features/billing/types";
import type { PricingPlan, PricingTier } from "../_components/pricing-card";

const TIER_BY_KEY: Record<string, PricingTier> = {
  SOLO: "solo",
  BASICO: "basico",
  INTERMEDIARIO: "intermediario",
  AVANCADO: "avancado",
};

const TAGLINE_BY_KEY: Record<string, string> = {
  SOLO: "Para quem atende sozinho e quer parar de perder horário.",
  BASICO: "Para quem está começando a organizar a agenda.",
  INTERMEDIARIO: "Para quem já sente o peso das faltas na agenda.",
  AVANCADO: "Para quem também precisa de prontuário clínico.",
};

const centsToBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

/** Converte o `Plan` que vem de `GET /plans` no formato visual do site. O
 * preço e as features são sempre os do backend — nunca hardcoded aqui,
 * para o site jamais divergir do que o Stripe realmente cobra nem do que
 * os guards de fato liberam. */
export function planToPricingCard(plan: Plan): PricingPlan {
  return {
    tier: TIER_BY_KEY[plan.key] ?? "basico",
    name: plan.name,
    tagline: TAGLINE_BY_KEY[plan.key] ?? "",
    price: centsToBRL(plan.priceInCents),
    priceSuffix: "/mês",
    detail:
      plan.maxProfessionals === null
        ? "profissionais ilimitados"
        : `até ${plan.maxProfessionals} profissional(is)`,
    ctaLabel: "Comece grátis",
    ctaHref: "/cadastro",
    features: planFeatureLines(plan),
  };
}
