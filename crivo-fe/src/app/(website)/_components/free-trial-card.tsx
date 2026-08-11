"use client";

import Link from "next/link";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const TRUST_POINTS = [
  "Sem cartão de crédito",
  "Todos os recursos liberados",
  "Cancele quando quiser",
];

/**
 * Card "Comece grátis" que aparece na parte de baixo das colunas de preços —
 * o trial saiu da grade de planos e virou um card separado (como o free tier
 * do snap financial), mantendo o acento esmeralda de "grátis".
 */
export const FreeTrialCard = () => {
  return (
    <ScrollReveal direction="up" delay={320} duration={700}>
      <div className="relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-linear-to-b from-emerald-500/5 to-transparent p-7 shadow-[0_0_40px_rgba(16,185,129,0.06)] backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              14 dias grátis
            </span>
            <h3 className="mt-3 text-2xl font-bold text-gray-900">
              Comece grátis
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              Teste por 14 dias. Leva menos de um minuto para criar sua conta.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
              {TRUST_POINTS.map((point) => (
                <span
                  key={point}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {point}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/cadastro"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(79,70,229,0.25)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_45px_rgba(79,70,229,0.4)]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Comece grátis
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
};
