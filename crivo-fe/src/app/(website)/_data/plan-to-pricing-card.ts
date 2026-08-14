import { planFeatureLines } from "@/features/billing/plan-features";
import type { Plan } from "@/features/billing/types";
import type { PricingPlan, PricingTier } from "../_components/pricing-card";

/**
 * Chaves da revisão de preço de 14/08/2026 (`SOLO`, `ESSENCIAL`,
 * `PROFISSIONAL`, `CLINICA`). As antigas seguem mapeadas porque continuam
 * no banco como inativas — clínica que assinou uma delas ainda vê o próprio
 * plano na tela de Assinatura, e sem a entrada aqui o card apareceria sem
 * estilo e sem descrição.
 */
const TIER_BY_KEY: Record<string, PricingTier> = {
  SOLO: "solo",
  ESSENCIAL: "basico",
  PROFISSIONAL: "intermediario",
  CLINICA: "avancado",
  // Aposentados:
  BASICO: "basico",
  INTERMEDIARIO: "intermediario",
  AVANCADO: "avancado",
};

const TAGLINE_BY_KEY: Record<string, string> = {
  SOLO: "Para quem atende sozinho e quer parar de perder horário.",
  ESSENCIAL: "Para a clínica que já tem equipe e agenda cheia.",
  // A partir daqui entra o que nenhum concorrente da faixa entrega.
  PROFISSIONAL: "Para quem já sente o peso das faltas no faturamento.",
  CLINICA: "Para clínica estabelecida, com vários profissionais.",
  // Aposentados:
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
    /**
     * Nem limite de profissionais nem franquia: as duas coisas já aparecem
     * na lista de features logo abaixo, e repeti-las aqui gastava a linha
     * mais visível do card com informação duplicada. O que ela diz agora é o
     * que a lista **não** diz — que dá para testar sem cartão.
     */
    detail: "14 dias grátis, sem cartão",
    ctaLabel: "Comece grátis",
    ctaHref: "/cadastro",
    features: planFeatureLines(plan),
  };
}
