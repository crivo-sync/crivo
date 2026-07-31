"use client";

import Link from "next/link";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const trustSignals = [
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    label: "Dados isolados por clínica",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    label: "Sem cartão de crédito",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    label: "Cancele quando quiser",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "WhatsApp oficial da Meta",
  },
];

export const FinalCta = () => {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-gray-900 md:py-28">
      {/* Large central glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-75 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-100 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-[100px]" />

      {/* Top separator line */}
      <div className="absolute top-0 left-1/4 h-px w-1/2 bg-linear-to-r from-transparent via-black/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal direction="up" delay={50} duration={600}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-600" />
            Comece hoje
          </span>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150} duration={700}>
          <h2 className="mt-8 text-4xl leading-[1.05] font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Pare de descobrir o buraco na agenda{" "}
            <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
              só quando o paciente não aparece
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={250} duration={850}>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-gray-600">
            Agenda, predição e mensageria trabalhando juntas na sua clínica —
            desde o primeiro dia.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={350} duration={700}>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
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
              href="/planos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 px-10 py-4 text-base font-semibold text-gray-900 transition-all duration-300 hover:bg-black/5"
            >
              Ver planos
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={450} duration={700}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center gap-1.5 text-sm text-gray-500"
              >
                <span className="text-gray-500">{signal.icon}</span>
                {signal.label}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
