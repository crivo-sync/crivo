"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const stats = [
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    value: "1 tela",
    label: "Nada de planilha paralela",
    description: "Agenda, histórico do paciente e WhatsApp no mesmo lugar",
    iconClass: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
    valueFrom: "from-indigo-600",
    valueTo: "to-violet-500",
    hoverBorder: "hover:border-indigo-500/20",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    // Era "D-1 / aviso um dia antes", o que subestima o produto e contradiz
    // `REMINDER_HOURS_BY_RISK`: quem tende a faltar recebe 72h **e** 24h
    // antes; quem sempre comparece recebe um só, para não virar spam.
    value: "2 avisos",
    label: "Mais insistência em quem falta",
    description: "Quem sempre comparece não vira spam: recebe um só",
    iconClass: "text-violet-600 bg-violet-500/10 border-violet-500/20",
    valueFrom: "from-violet-500",
    valueTo: "to-indigo-400",
    hoverBorder: "hover:border-violet-500/20",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </svg>
    ),
    value: "“sim”",
    label: "Confirmar dá uma palavra",
    description: "Sem baixar app, sem cadastro, sem precisar abrir link",
    iconClass: "text-gray-700 bg-gray-500/10 border-gray-500/20",
    valueFrom: "from-gray-700",
    valueTo: "to-gray-500",
    hoverBorder: "hover:border-gray-500/20",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    value: "100%",
    label: "Nenhuma falha silenciosa",
    description: "Envios que falham viram lista pra recepção ligar",
    iconClass: "text-indigo-700 bg-indigo-500/10 border-indigo-500/20",
    valueFrom: "from-indigo-700",
    valueTo: "to-indigo-500",
    hoverBorder: "hover:border-indigo-500/20",
  },
];

export const ImpactBand = () => {
  return (
    <section className="relative overflow-hidden bg-white py-16 text-gray-900 md:py-20">
      {/* Subtle vertical gradient band */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-indigo-100/40 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <ScrollReveal key={stat.label} direction="up" delay={idx * 80} duration={700}>
              <div
                className={`group relative rounded-2xl border border-black/8 bg-linear-to-b from-black/3 to-transparent p-6 backdrop-blur-sm transition-all duration-500 ${stat.hoverBorder} hover:bg-black/3`}
              >
                <div className={`mb-5 inline-flex rounded-xl border p-2.5 ${stat.iconClass}`}>
                  {stat.icon}
                </div>
                <p
                  className={`bg-linear-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent ${stat.valueFrom} ${stat.valueTo}`}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{stat.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {stat.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
