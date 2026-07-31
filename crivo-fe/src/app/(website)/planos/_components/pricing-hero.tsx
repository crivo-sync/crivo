"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const PricingHero = () => {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-8 text-gray-900 md:pt-24">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-100 w-225 -translate-x-1/2 rounded-full bg-indigo-600/5 blur-[160px]" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
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
            Planos e preços
          </span>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150} duration={700}>
          <h1 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Planos do tamanho{" "}
            <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
              da sua clínica
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={250} duration={850}>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
            Cobrança por profissional ativo. O preço cresce junto com a sua
            operação, não com o número de agendamentos.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};
