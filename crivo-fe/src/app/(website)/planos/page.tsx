import type { Metadata } from "next";

import { PricingHero } from "./_components/pricing-hero";
import { PricingGrid } from "./_components/pricing-grid";
import { ComparisonNote } from "./_components/comparison-note";
import { TrustBanner } from "./_components/trust-banner";
import { PricingFaq } from "./_components/pricing-faq";
import { PricingCta } from "./_components/pricing-cta";

export const metadata: Metadata = {
  title: "Planos — Crivo",
  description:
    "A partir de R$ 49/mês. O plano acompanha o tamanho da sua equipe, não o número de agendamentos. 14 dias grátis, sem cartão.",
};

const PlanosPage = () => {
  return (
    <>
      <PricingHero />
      <PricingGrid />
      <ComparisonNote />
      <TrustBanner />
      <PricingFaq />
      <PricingCta />
    </>
  );
};

export default PlanosPage;
