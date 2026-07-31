import type { Metadata } from "next";

import { Hero } from "./_components/hero";
import { PainPoints } from "./_components/pain-points";
import { ImpactBand } from "./_components/impact-band";
import { ModuleTabs } from "./_components/module-tabs";
import { Differentiators } from "./_components/differentiators";
import { SocialProof } from "./_components/social-proof";
import { Testimonials } from "./_components/testimonials";
import { PricingTeaser } from "./_components/pricing-teaser";
import { FinalCta } from "./_components/final-cta";

export const metadata: Metadata = {
  title: "Crivo — O motor que evita buracos na sua agenda",
  description:
    "Agenda, predição de no-show e mensageria automática num único motor para clínicas de estética e odontologia.",
};

const HomePage = () => {
  return (
    <>
      <Hero />
      <PainPoints />
      <ImpactBand />
      <ModuleTabs />
      <Differentiators />
      <SocialProof />
      <Testimonials />
      <PricingTeaser />
      <FinalCta />
    </>
  );
};

export default HomePage;
