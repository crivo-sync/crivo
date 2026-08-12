"use client";

import Skeleton from "@mui/material/Skeleton";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { usePlans } from "@/features/billing/hooks/use-plans";
import { planToPricingCard } from "../../_data/plan-to-pricing-card";
import { PricingCard } from "../../_components/pricing-card";
import { FreeTrialCard } from "../../_components/free-trial-card";

export const PricingGrid = () => {
  const { plans, isLoading } = usePlans();

  return (
    <section className="relative overflow-hidden px-6 pt-8 pb-6 text-gray-900">
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-125 w-125 rounded-full bg-indigo-600/3 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((idx) => (
                <Skeleton
                  key={idx}
                  variant="rounded"
                  height={420}
                  sx={{ borderRadius: 6 }}
                />
              ))
            : plans.map((plan, idx) => (
                <ScrollReveal
                  key={plan.id}
                  direction="up"
                  delay={idx * 100}
                  duration={700}
                >
                  <PricingCard plan={planToPricingCard(plan)} />
                </ScrollReveal>
              ))}
        </div>

        <FreeTrialCard />

        <ScrollReveal direction="up" delay={450} duration={700}>
          <p className="mt-8 text-center text-sm text-gray-500">
            O teste vale para qualquer plano · Valores em fase de validação com
            clientes reais e sujeitos a ajuste ·{" "}
            <span className="text-gray-600">Sem fidelidade</span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};
