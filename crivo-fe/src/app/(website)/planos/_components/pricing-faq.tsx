"use client";

import { useState } from "react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const FAQS = [
  {
    question: "Preciso de cartão de crédito para testar?",
    answer:
      "Não. Você fala com o time, a gente configura sua clínica e você testa antes de qualquer cobrança. Ainda estamos definindo a duração exata do período de teste — fale com o time para saber as condições atuais.",
  },
  {
    question: "Quando a predição de no-show fica disponível?",
    answer:
      "A predição é o diferencial do Crivo e está em desenvolvimento — hoje entra a partir do plano Clínica assim que liberada, começando com regras simples de risco antes de virar um modelo de IA completo.",
  },
  {
    question: "Como funciona a cobrança por profissional?",
    answer:
      "Você paga por profissional ativo na sua conta, não por agendamento. O plano Clínica inclui até 3 profissionais e cobra R$ 49 por profissional extra. Profissional inativo no mês não entra na conta.",
  },
  {
    question: "Dá para trocar de plano depois?",
    answer:
      "Sim. A ideia é que o plano acompanhe o crescimento da clínica — upgrade e downgrade estão sendo modelados junto com o módulo financeiro.",
  },
  {
    question: "O que acontece se eu passar do limite de profissionais do plano?",
    answer:
      "Essa regra ainda está em definição: bloqueio, cobrança automática do excedente ou aviso prévio. Vamos deixar isso claro antes do lançamento comercial.",
  },
  {
    question: "O WhatsApp é oficial?",
    answer:
      "Sim, sempre. O Crivo usa exclusivamente a API oficial da Meta (WhatsApp Cloud API). Soluções não-oficiais levam a banimento permanente do número da clínica — por isso nunca trabalhamos com elas.",
  },
];

export const PricingFaq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden px-6 py-24 text-gray-900">
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-100 w-175 -translate-x-1/2 rounded-full bg-indigo-600/3 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/3 px-4 py-1.5 text-xs font-semibold tracking-wider text-gray-600 uppercase">
              FAQ
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-3xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-4xl">
              Perguntas{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                frequentes
              </span>
            </h2>
          </ScrollReveal>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <ScrollReveal key={faq.question} direction="up" delay={index * 60} duration={600}>
                <div
                  className={`overflow-hidden rounded-2xl border bg-linear-to-b from-black/3 to-transparent backdrop-blur-sm transition-all duration-300 ${
                    isOpen
                      ? "border-indigo-500/30 bg-black/2"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-45 text-indigo-600" : "text-gray-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[15px] leading-relaxed text-gray-600">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
