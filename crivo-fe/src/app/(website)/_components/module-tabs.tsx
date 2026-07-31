"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AgendaMock } from "./mocks/agenda-mock";
import { PredictionMock } from "./mocks/prediction-mock";
import { MessagingMock } from "./mocks/messaging-mock";
import { BillingMock } from "./mocks/billing-mock";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

type ModuleFeature = {
  id: string;
  badge: string;
  title: string;
  description: string;
  points: string[];
  accent: {
    icon: string;
    check: string;
    checkBg: string;
    glow: string;
    hoverBorder: string;
  };
  icon: React.ReactNode;
  visual: React.ReactNode;
  reverse?: boolean;
};

const MODULES: ModuleFeature[] = [
  {
    id: "agenda",
    badge: "Core · disponível",
    title: "Horário livre, sem slot engessado",
    description:
      "A recepção marca em qualquer horário e o sistema valida sobreposição sozinho — do jeito que clínica pequena de fato trabalha.",
    points: [
      "Profissionais, procedimentos e agenda num só lugar",
      "Duração e preço derivados do procedimento, sem digitar duas vezes",
      "Conflito de horário bloqueado automaticamente",
      "Histórico de confirmado, concluído, cancelado e falta",
    ],
    accent: {
      icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      check: "text-amber-300",
      checkBg: "bg-amber-500/20 border-amber-500/40",
      glow: "bg-amber-600/10",
      hoverBorder: "hover:border-amber-500/30",
    },
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    visual: <AgendaMock />,
  },
  {
    id: "predicao",
    badge: "Core · em desenvolvimento",
    title: "O motor que avalia o risco antes da falta acontecer",
    description:
      "Predição de no-show a partir do histórico real de comportamento da clínica — quem costuma faltar, por qual motivo, em qual tipo de procedimento.",
    points: [
      "Aprende com o histórico de faltas e cancelamentos da própria clínica",
      "Aciona mensagens diferenciadas quando o risco é alto",
      "Disponível a partir do plano Clínica",
      "Especialização por nicho: odontologia e estética, sem ruído de outros segmentos",
    ],
    accent: {
      icon: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      check: "text-indigo-300",
      checkBg: "bg-indigo-500/20 border-indigo-500/40",
      glow: "bg-indigo-600/10",
      hoverBorder: "hover:border-indigo-500/30",
    },
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    visual: <PredictionMock />,
    reverse: true,
  },
  {
    id: "mensageria",
    badge: "Core · disponível",
    title: "Lembrete automático, confirmação sem app",
    description:
      "Lembrete por WhatsApp um dia antes da consulta, com link de confirmação direto — e nunca falha em silêncio.",
    points: [
      "Lembrete automático D-1 e confirmação por link",
      "Retry automático com backoff antes de desistir do envio",
      "Falhas viram lista pronta pra recepção ligar",
      "Texto reescrito por IA de forma opcional, com fallback pro template fixo",
    ],
    accent: {
      icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      check: "text-emerald-300",
      checkBg: "bg-emerald-500/20 border-emerald-500/40",
      glow: "bg-emerald-600/10",
      hoverBorder: "hover:border-emerald-500/30",
    },
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    visual: <MessagingMock />,
  },
  {
    id: "financeiro",
    badge: "Em desenvolvimento",
    title: "Cobrança por profissional ativo, sem pegadinha de volume",
    description:
      "Assinatura mensal via Stripe, com o preço acompanhando o tamanho da clínica em vez de punir quem está começando.",
    points: [
      "Preço por profissional ativo, não por agendamento",
      "Predição de no-show liberada a partir do plano Clínica",
      "Planos com limite de profissionais e upgrade simples",
      "Relatórios consolidados para clínicas com múltiplas unidades",
    ],
    accent: {
      icon: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      check: "text-cyan-300",
      checkBg: "bg-cyan-500/20 border-cyan-500/40",
      glow: "bg-cyan-600/10",
      hoverBorder: "hover:border-cyan-500/30",
    },
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    visual: <BillingMock />,
    reverse: true,
  },
];

export const ModuleTabs = () => {
  return (
    <section
      id="modulos"
      className="relative overflow-hidden bg-white py-20 text-gray-900 scroll-mt-20 md:py-28"
    >
      {/* Section-wide ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-indigo-600/3 blur-[180px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
              <svg
                className="h-3.5 w-3.5 animate-pulse text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Como funciona
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Um módulo puxa o outro —{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                sem retrabalho manual
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} duration={850}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Agenda, predição, mensageria e financeiro no mesmo motor. O que
              acontece num módulo alimenta o próximo automaticamente.
            </p>
          </ScrollReveal>
        </div>

        {/* Modules */}
        <ul className="space-y-0">
          {MODULES.map((mod, idx) => (
            <li
              key={mod.id}
              id={mod.id}
              className={`relative grid grid-cols-1 items-center gap-12 py-12 scroll-mt-24 lg:grid-cols-12 lg:gap-20 md:py-20 ${
                idx < MODULES.length - 1
                  ? "after:absolute after:bottom-0 after:left-1/4 after:h-px after:w-1/2 after:bg-linear-to-r after:from-transparent after:via-black/10 after:to-transparent after:content-['']"
                  : ""
              }`}
            >
              {/* Per-module glow */}
              <div
                className={`pointer-events-none absolute top-1/2 h-125 w-125 -translate-y-1/2 rounded-full ${mod.accent.glow} blur-[130px] ${
                  mod.reverse ? "-right-20" : "-left-20"
                }`}
              />

              {/* Content */}
              <div
                className={`relative space-y-6 lg:col-span-5 ${mod.reverse ? "lg:order-2" : ""}`}
              >
                <ScrollReveal
                  direction={mod.reverse ? "left" : "right"}
                  delay={100}
                  duration={800}
                >
                  <div className={`inline-flex rounded-2xl border p-3 ${mod.accent.icon}`}>
                    {mod.icon}
                  </div>
                </ScrollReveal>

                <ScrollReveal
                  direction={mod.reverse ? "left" : "right"}
                  delay={180}
                  duration={800}
                >
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-black/3 px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-600 uppercase">
                    {mod.badge}
                  </span>
                  <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    {mod.title}
                  </h3>
                </ScrollReveal>

                <ScrollReveal
                  direction={mod.reverse ? "left" : "right"}
                  delay={300}
                  duration={800}
                >
                  <p className="text-lg leading-relaxed text-gray-600">
                    {mod.description}
                  </p>
                </ScrollReveal>

                <ScrollReveal
                  direction={mod.reverse ? "left" : "right"}
                  delay={400}
                  duration={800}
                >
                  <ul className="space-y-3 text-gray-700">
                    {mod.points.map((point) => (
                      <li key={point} className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${mod.accent.checkBg} ${mod.accent.check}`}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-base">{point}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>
              </div>

              {/* Visual */}
              <div className={`relative lg:col-span-7 ${mod.reverse ? "lg:order-1" : ""}`}>
                <ScrollReveal
                  direction={mod.reverse ? "right" : "left"}
                  delay={200}
                  duration={900}
                >
                  <div
                    className={`group relative overflow-hidden rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 md:p-8 ${mod.accent.hoverBorder}`}
                  >
                    <div
                      className={`pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full ${mod.accent.glow} blur-3xl transition-all duration-500`}
                    />
                    <div className="relative">{mod.visual}</div>
                  </div>
                </ScrollReveal>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
