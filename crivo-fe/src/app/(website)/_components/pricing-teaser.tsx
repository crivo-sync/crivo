"use client";

import Link from "next/link";
import Skeleton from "@mui/material/Skeleton";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { usePlans } from "@/features/billing/hooks/use-plans";
import { planToPricingCard } from "../_data/plan-to-pricing-card";
import { PricingCard } from "./pricing-card";
import { FreeTrialCard } from "./free-trial-card";

export const PricingTeaser = () => {
  const { plans, isLoading } = usePlans();

  return (
    <section
      id="planos"
      className="relative overflow-hidden bg-white py-20 text-gray-900 scroll-mt-20 md:py-28"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-100 w-225 -translate-x-1/2 rounded-full bg-indigo-600/4 blur-[160px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-125 w-125 rounded-full bg-indigo-600/3 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Planos simples
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Preço transparente,{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                zero surpresa
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} duration={850}>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              Cobrança por profissional ativo, nunca por agendamento. 14 dias de
              teste grátis em qualquer plano.
            </p>
          </ScrollReveal>
        </div>

        {/* Plan cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((idx) => (
                <Skeleton
                  key={idx}
                  variant="rounded"
                  height={340}
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
                  <PricingCard plan={planToPricingCard(plan)} compact />
                </ScrollReveal>
              ))}
        </div>

        <FreeTrialCard />

        {/* Comparison link */}
        <ScrollReveal direction="up" delay={450} duration={700}>
          <div className="mt-8 text-center">
            <p className="mb-1 text-sm text-gray-500">
              Quer ver tudo lado a lado?
            </p>
            <Link
              href="/planos"
              className="text-sm text-indigo-600 underline underline-offset-4 transition-colors hover:text-indigo-500"
            >
              Ver comparativo completo de recursos →
            </Link>
          </div>
        </ScrollReveal>

        {/* Footer note */}
        <ScrollReveal direction="up" delay={450} duration={700}>
          <p className="mt-6 text-center text-sm text-gray-500">
            Dados isolados por clínica · WhatsApp na API oficial da Meta ·{" "}
            <span className="text-gray-600">Cancele quando quiser</span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};
