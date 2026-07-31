"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const PAIN_POINTS = [
  {
    title: "Faltas sem aviso",
    description:
      "O paciente simplesmente não aparece. O horário fica vazio, o profissional fica parado e a receita do dia já era.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    iconClass: "text-orange-600 bg-orange-500/10 border-orange-500/20",
    hoverBorder: "hover:border-orange-500/30",
    glow: "bg-orange-600/10",
  },
  {
    title: "Agenda no improviso",
    description:
      "Confirmação manual pelo WhatsApp da recepcionista, planilha paralela, encaixe decidido na hora. Não escala e não deixa histórico.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    iconClass: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    hoverBorder: "hover:border-amber-500/30",
    glow: "bg-amber-600/10",
  },
  {
    title: "Decisão no escuro",
    description:
      "Sem histórico de comportamento, é impossível saber qual horário está em risco antes que ele vire prejuízo.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </svg>
    ),
    iconClass: "text-gray-600 bg-gray-500/10 border-gray-500/20",
    hoverBorder: "hover:border-gray-500/30",
    glow: "bg-gray-600/10",
  },
];

export const PainPoints = () => {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-gray-900 md:py-28">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-indigo-900/4 blur-[180px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
              <svg
                className="h-3.5 w-3.5 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M5.062 19h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              O problema
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              A agenda cheia esconde a agenda{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                que não vai acontecer
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} duration={850}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Toda clínica convive com os mesmos três buracos — e nenhum deles
              aparece na agenda até ser tarde demais.
            </p>
          </ScrollReveal>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {PAIN_POINTS.map((point, idx) => (
            <ScrollReveal key={point.title} direction="up" delay={idx * 100} duration={700}>
              <div
                className={`group relative h-full overflow-hidden rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent p-8 backdrop-blur-sm transition-all duration-500 ${point.hoverBorder}`}
              >
                <div
                  className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full ${point.glow} blur-3xl transition-all duration-500`}
                />
                <div className="relative">
                  <div className={`inline-flex rounded-2xl border p-3 ${point.iconClass}`}>
                    {point.icon}
                  </div>
                  <h3 className="mt-5 mb-2.5 text-xl font-bold text-gray-900">
                    {point.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-gray-600">
                    {point.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
