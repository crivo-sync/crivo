"use client";

import { Fragment } from "react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

type FeatureRow = {
  label: string;
  essencial: boolean;
  clinica: boolean;
  rede: boolean;
};

const GROUPS: { group: string; rows: FeatureRow[] }[] = [
  {
    group: "Agenda",
    rows: [
      {
        label: "Agenda com controle de conflito de horário",
        essencial: true,
        clinica: true,
        rede: true,
      },
      {
        label: "Cadastro completo de pacientes",
        essencial: true,
        clinica: true,
        rede: true,
      },
      {
        label: "Preço e duração derivados do procedimento",
        essencial: true,
        clinica: true,
        rede: true,
      },
    ],
  },
  {
    group: "Mensageria",
    rows: [
      {
        label: "Lembretes automáticos de WhatsApp (D-1)",
        essencial: true,
        clinica: true,
        rede: true,
      },
      {
        label: "Confirmação de presença por link",
        essencial: true,
        clinica: true,
        rede: true,
      },
      {
        label: "Retry automático + lista de falhas",
        essencial: true,
        clinica: true,
        rede: true,
      },
      {
        label: "Mensagens reescritas por IA (opcional)",
        essencial: false,
        clinica: true,
        rede: true,
      },
    ],
  },
  {
    group: "Predição",
    rows: [
      {
        label: "Predição de risco de no-show",
        essencial: false,
        clinica: true,
        rede: true,
      },
      {
        label: "Reativação inteligente de pacientes",
        essencial: false,
        clinica: true,
        rede: true,
      },
      {
        label: "Painel de métricas de ocupação",
        essencial: false,
        clinica: true,
        rede: true,
      },
    ],
  },
  {
    group: "Operação",
    rows: [
      {
        label: "Gestão multi-unidade",
        essencial: false,
        clinica: false,
        rede: true,
      },
      {
        label: "Relatórios consolidados",
        essencial: false,
        clinica: false,
        rede: true,
      },
      { label: "Suporte prioritário", essencial: false, clinica: false, rede: true },
      { label: "Onboarding assistido", essencial: false, clinica: false, rede: true },
    ],
  },
];

const COLUMNS = [
  { key: "essencial" as const, label: "Essencial", accent: "text-teal-300" },
  { key: "clinica" as const, label: "Clínica", accent: "text-amber-300" },
  { key: "rede" as const, label: "Rede", accent: "text-indigo-300" },
];

const Cell = ({ included }: { included: boolean }) =>
  included ? (
    <svg
      className="mx-auto h-4 w-4 text-emerald-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg
      className="mx-auto h-4 w-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

export const ComparisonNote = () => {
  return (
    <section className="relative overflow-hidden px-6 pt-20 text-gray-900">
      <div className="pointer-events-none absolute top-1/2 left-1/4 h-100 w-100 -translate-y-1/2 rounded-full bg-indigo-600/3 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/3 px-4 py-1.5 text-xs font-semibold tracking-wider text-gray-600 uppercase">
              Comparativo
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-3xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-4xl">
              Tudo que você leva{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                em cada plano
              </span>
            </h2>
          </ScrollReveal>
        </div>

        <ScrollReveal
          direction="up"
          delay={200}
          duration={800}
          className="overflow-hidden rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent backdrop-blur-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Recurso
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-4 text-center text-sm font-bold ${col.accent}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((group) => (
                  <Fragment key={group.group}>
                    <tr className="bg-black/1.5">
                      <td
                        colSpan={4}
                        className="px-6 py-2.5 text-[11px] font-bold tracking-wider text-gray-500 uppercase"
                      >
                        {group.group}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-black/5 transition-colors last:border-0 hover:bg-black/1.5"
                      >
                        <td className="px-6 py-3.5 text-gray-700">{row.label}</td>
                        <td className="px-4 py-3.5">
                          <Cell included={row.essencial} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Cell included={row.clinica} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Cell included={row.rede} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        {/* Notes */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Sem plano gratuito",
              description: "WhatsApp e predição têm custo real por clínica",
            },
            {
              title: "Preço por profissional",
              description: "não por agendamento — conta previsível todo mês",
            },
            {
              title: "Upgrade simples",
              description: "mude de plano conforme a clínica cresce",
            },
          ].map((note, idx) => (
            <ScrollReveal key={note.title} direction="up" delay={idx * 80} duration={700}>
              <div className="text-center">
                <div className="mb-1.5 text-base font-bold text-gray-900">
                  {note.title}
                </div>
                <div className="text-[13px] leading-relaxed text-gray-600">
                  {note.description}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
