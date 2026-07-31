"use client";

import Link from "next/link";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const trustSignals = [
  { label: "Sem fidelidade" },
  { label: "Sem cartão de crédito" },
  { label: "Migração assistida" },
  { label: "WhatsApp oficial da Meta" },
];

export const PricingCta = () => {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-center text-gray-900">
      {/* Central glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-75 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-100 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-[100px]" />

      {/* Top separator */}
      <div className="absolute top-0 left-1/4 h-px w-1/2 bg-linear-to-r from-transparent via-black/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <ScrollReveal direction="up" delay={50} duration={700}>
          <h2 className="text-4xl leading-[1.05] font-bold tracking-tight text-gray-900 md:text-5xl">
            Pronto para{" "}
            <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
              começar?
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150} duration={800}>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            Fale com o time do Crivo e veja o plano certo para o tamanho da sua
            clínica.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={250} duration={700}>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/#contato"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-10 py-4 text-base font-semibold text-white shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Comece grátis
            </Link>
            <Link
              href="/#contato"
              className="inline-flex items-center justify-center rounded-full border border-black/20 px-10 py-4 text-base font-semibold text-gray-900 transition-all duration-300 hover:bg-black/5"
            >
              Falar com especialista
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={350} duration={700}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center gap-1.5 text-sm text-gray-500"
              >
                <svg
                  className="h-3.5 w-3.5 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {signal.label}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
