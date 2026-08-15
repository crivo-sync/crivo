import Link from "next/link";

import { RegisterCta } from "./register-cta";

/**
 * O que o produto **faz**, não como funciona por dentro.
 *
 * A versão anterior anunciava "3x mais lembrete" e "4x reenvio antes de
 * desistir": números verdadeiros (conferidos em `REMINDER_HOURS_BY_RISK` e
 * `SEND_JOB_OPTIONS.attempts`), mas que descrevem o motor. Quem lê é dono de
 * clínica decidindo onde gastar R$ 149/mês, e "4x reenvio" não é benefício —
 * é implementação.
 *
 * Continuam sendo afirmações verificáveis no código, não promessa de
 * resultado: nenhum diz "reduz faltas em X%", porque isso nós não medimos.
 */
const STATS = [
  {
    icon: "📵",
    value: "Sem app",
    label: "o paciente confirma respondendo “sim”",
  },
  {
    icon: "🎯",
    value: "Sem furo",
    label: "mensagem que falha vira lista pra ligar",
  },
  {
    icon: "👐",
    value: "Vaga aberta",
    label: "quem está na espera é chamado na hora",
  },
  {
    icon: "😓",
    value: "Vaga fechada",
    label: "quem não confirma é bloqueado na agenda",
  },
  {
    icon: "😩",
    value: "Vaga cancelada",
    label: "quem não confirma é bloqueado na agenda",
  },
];

export const Hero = () => {
  return (
    <section
      id="produto"
      className="relative overflow-hidden px-4 py-16 md:py-24 scroll-mt-20"
    >
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute top-1/3 -left-20 h-125 w-125 rounded-full bg-indigo-700/8 blur-[140px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-100 w-100 rounded-full bg-indigo-600/6 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-75 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/3 blur-[160px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-2 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-6 inline-block rounded-full border border-black/15 bg-black/3 px-4 py-2">
            <p className="text-sm tracking-wide text-gray-700">
              ✨ Para clínicas de estética e odontologia
            </p>
          </div>

          {/*
            A versão anterior era "O motor que evita buracos na sua agenda":
            bonita, mas mecanismo — o dono da clínica tinha que traduzir
            sozinho para dinheiro. Agora a manchete é a perda dele, e a
            calculadora logo abaixo deixa que ele mesmo faça a conta.
          */}
          <h1 className="text-5xl leading-[1.05] font-bold text-gray-900 md:text-6xl lg:text-7xl">
            Cada falta leva embora{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400">
              o faturamento do dia
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            O paciente não aparece, o horário fica vazio e ninguém entra no
            lugar. O Crivo lembra quem tende a faltar, avisa a recepção quando a
            mensagem não chega e oferece a vaga a quem está esperando.
          </p>

          <div className="flex flex-col gap-4 pt-8 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
            >
              <span>→</span>
              Comece grátis
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 px-8 py-4 text-base font-semibold text-gray-900 transition-all duration-300 hover:bg-black/5"
            >
              Ver planos
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent p-7 shadow-2xl backdrop-blur-xl">
          <RegisterCta />
        </div>
      </div>

      <div className="flex items-center justify-between max-w-7xl mx-auto gap-6 pt-12 text-gray-700">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/5 text-lg">
                {stat.icon}
              </span>
              <div className="text-2xl font-bold tracking-tight text-gray-900">
                {stat.value}
              </div>
              <div className="text-center mt-0.5 text-[13px] text-gray-500">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
