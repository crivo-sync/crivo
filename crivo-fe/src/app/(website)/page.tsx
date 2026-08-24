import type { Metadata } from "next";

import { Hero } from "./_components/hero";
import { PainPoints } from "./_components/pain-points";
import { LossCalculator } from "./_components/loss-calculator";
import { ImpactBand } from "./_components/impact-band";
import { ModuleTabs } from "./_components/module-tabs";
import { Differentiators } from "./_components/differentiators";
import { SocialProof } from "./_components/social-proof";
import { Testimonials } from "./_components/testimonials";
import { PricingTeaser } from "./_components/pricing-teaser";
import { FinalCta } from "./_components/final-cta";
import { SHOW_SOCIAL_PROOF } from "./_data/social-proof";

export const metadata: Metadata = {
  title: "Crivo Sync — Pare de perder dinheiro com faltas na agenda",
  description:
    "Calcule quanto as faltas custam na sua clínica. O Crivo Sync lembra quem tende a faltar pelo WhatsApp, avisa a recepção quando a mensagem não chega e oferece a vaga a quem está esperando. 14 dias grátis, sem cartão.",
};

const HomePage = () => {
  return (
    <>
      <Hero />
      <PainPoints />
      {/*
        Logo depois da dor: a pessoa acabou de se reconhecer nos três buracos,
        e aqui mede o próprio. Antes da lista de recursos de propósito —
        recurso só interessa a quem já aceitou que tem o problema.
      */}
      <LossCalculator />
      <ImpactBand />
      <ModuleTabs />
      <Differentiators />
      {/* Escondidas até haver cliente real — ver `_data/social-proof.ts`. */}
      {SHOW_SOCIAL_PROOF && (
        <>
          <SocialProof />
          <Testimonials />
        </>
      )}
      <PricingTeaser />
      <FinalCta />
    </>
  );
};

export default HomePage;
