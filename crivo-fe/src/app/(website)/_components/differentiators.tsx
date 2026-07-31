"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const DIFFERENTIATORS = [
  {
    emoji: "🔗",
    title: "Tríade integrada",
    description:
      "Agenda, predição e mensageria conversam entre si — não são três sistemas colados.",
    iconClass: "bg-indigo-500/10 border-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/25",
  },
  {
    emoji: "🏥",
    title: "Multi-tenant white-label",
    description:
      "Cada clínica tem sua própria marca, cores e subdomínio, com dados totalmente isolados.",
    iconClass: "bg-violet-500/10 border-violet-500/20",
    hoverBorder: "hover:border-violet-500/25",
  },
  {
    emoji: "🔒",
    title: "Isolamento por clínica",
    description:
      "O tenant nunca vem do body nem da URL — sempre do token. Não dá para forjar acesso a outra clínica.",
    iconClass: "bg-gray-500/10 border-gray-500/20",
    hoverBorder: "hover:border-gray-500/25",
  },
  {
    emoji: "💬",
    title: "Confirmação sem app",
    description:
      "O paciente confirma a presença clicando num link, sem baixar nada.",
    iconClass: "bg-indigo-500/10 border-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/25",
  },
  {
    emoji: "✨",
    title: "IA opcional na redação",
    description:
      "Mensagens mais naturais quando ativado — mas a IA só redige, nunca decide o fato.",
    iconClass: "bg-violet-500/10 border-violet-500/20",
    hoverBorder: "hover:border-violet-500/25",
  },
  {
    emoji: "🛡️",
    title: "Nunca trava por causa da IA",
    description:
      "Se a IA falhar ou demorar, o envio cai automaticamente pro template fixo de sempre.",
    iconClass: "bg-gray-500/10 border-gray-500/20",
    hoverBorder: "hover:border-gray-500/25",
  },
];

export const Differentiators = () => {
  return (
    <section
      id="diferenciais"
      className="relative overflow-hidden bg-white py-20 text-gray-900 scroll-mt-20 md:py-28"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-indigo-600/3 blur-[180px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center text-center">
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              Diferenciais
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Feito para o padrão de comportamento{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                da sua especialidade
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} duration={850}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Odontologia e estética têm padrões de falta diferentes. O Crivo é
              construído em cima disso — não é um CRM genérico adaptado.
            </p>
          </ScrollReveal>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map((item, idx) => (
            <ScrollReveal key={item.title} direction="up" delay={idx * 80} duration={700}>
              <div
                className={`group h-full rounded-2xl border border-black/8 bg-linear-to-b from-black/3 to-transparent p-7 backdrop-blur-sm transition-all duration-500 ${item.hoverBorder} hover:bg-black/3`}
              >
                <div
                  className={`mb-4 flex size-11 items-center justify-center rounded-xl border text-lg ${item.iconClass}`}
                >
                  {item.emoji}
                </div>
                <h3 className="mb-2 text-[17px] font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
