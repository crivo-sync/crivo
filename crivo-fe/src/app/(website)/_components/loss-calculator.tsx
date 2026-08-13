"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatCentsToBRL } from "@/lib/currency";

/**
 * Quanto a falta custa **na clínica de quem está lendo**.
 *
 * O concorrente promete "recupere até R$ 1.500/mês". Nós não temos cliente
 * para sustentar um número desses, e inventá-lo contradiria a régua do
 * produto inteiro — a medição de acurácia se recusa a concluir com amostra
 * menor que 30 casos. Copiar a promessa seria abandonar justamente o que nos
 * diferencia.
 *
 * A saída é o visitante fazer a conta com os números dele: a multiplicação é
 * dele, a perda é dele, e nós não afirmamos nada sobre quanto disso o Crivo
 * evita. É a mesma disciplina do card de custo das faltas no painel, aplicada
 * antes de a pessoa virar cliente.
 */

/** Ancoram a conta em algo plausível; o visitante troca os três. */
const DEFAULTS = { noShowsPerWeek: 3, ticketInReais: 250 };

const WEEKS_PER_MONTH = 4.33; // 52 / 12 — usar 4 subestimaria em ~8%

const FIELD_LIMITS = {
  noShowsPerWeek: { min: 0, max: 100 },
  ticketInReais: { min: 0, max: 100_000 },
};

function clamp(value: number, { min, max }: { min: number; max: number }) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export const LossCalculator = () => {
  const [noShowsPerWeek, setNoShowsPerWeek] = useState(DEFAULTS.noShowsPerWeek);
  const [ticketInReais, setTicketInReais] = useState(DEFAULTS.ticketInReais);

  const { monthlyInCents, yearlyInCents } = useMemo(() => {
    const monthly = noShowsPerWeek * WEEKS_PER_MONTH * ticketInReais * 100;
    return {
      monthlyInCents: Math.round(monthly),
      yearlyInCents: Math.round(monthly * 12),
    };
  }, [noShowsPerWeek, ticketInReais]);

  const semPerda = monthlyInCents === 0;

  return (
    <section
      id="calculadora"
      className="relative overflow-hidden bg-white py-20 text-gray-900 md:py-28 scroll-mt-20"
    >
      <div className="pointer-events-none absolute top-0 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-indigo-900/4 blur-[180px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
              Faça a conta
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl">
              Quanto as faltas custam{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                na sua clínica
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} duration={850}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Dois números que você já sabe de cabeça. A conta é sua — nós só
              mostramos o total que a agenda esconde.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={300} duration={800}>
          <div className="grid gap-8 rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent p-8 backdrop-blur-sm md:grid-cols-[1fr_1fr] md:p-10">
            <div className="flex flex-col justify-center gap-7">
              <div>
                <label
                  htmlFor="no-shows-per-week"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Faltas por semana
                </label>
                <p className="mt-1 mb-3 text-xs text-gray-500">
                  Pacientes que não aparecem e não avisam.
                </p>
                <input
                  id="no-shows-per-week"
                  type="number"
                  inputMode="numeric"
                  min={FIELD_LIMITS.noShowsPerWeek.min}
                  max={FIELD_LIMITS.noShowsPerWeek.max}
                  value={noShowsPerWeek}
                  onChange={(event) =>
                    setNoShowsPerWeek(
                      clamp(
                        event.target.valueAsNumber,
                        FIELD_LIMITS.noShowsPerWeek,
                      ),
                    )
                  }
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-lg font-semibold text-gray-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="ticket-in-reais"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Valor médio do atendimento
                </label>
                <p className="mt-1 mb-3 text-xs text-gray-500">
                  Quanto entra, em reais, quando o paciente comparece.
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-3 transition-colors focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <span className="text-lg font-semibold text-gray-400">
                    R$
                  </span>
                  <input
                    id="ticket-in-reais"
                    type="number"
                    inputMode="numeric"
                    min={FIELD_LIMITS.ticketInReais.min}
                    max={FIELD_LIMITS.ticketInReais.max}
                    value={ticketInReais}
                    onChange={(event) =>
                      setTicketInReais(
                        clamp(
                          event.target.valueAsNumber,
                          FIELD_LIMITS.ticketInReais,
                        ),
                      )
                    }
                    className="w-full bg-transparent text-lg font-semibold text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-7 text-center">
              {semPerda ? (
                // Zerar os campos não deve exibir "R$ 0,00 por ano" como se
                // fosse um resultado — parece defeito, não resposta.
                <p className="text-base leading-relaxed text-gray-600">
                  Preencha os dois campos para ver o total.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">
                    Sua clínica deixa de faturar
                  </p>
                  <p className="mt-2 bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
                    {formatCentsToBRL(monthlyInCents)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">por mês</p>

                  <div className="mx-auto my-6 h-px w-16 bg-black/10" />

                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {formatCentsToBRL(yearlyInCents)}
                    </span>{" "}
                    por ano
                  </p>

                  <Link
                    href="/cadastro"
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(79,70,229,0.25)] transition-all duration-300 hover:bg-indigo-500"
                  >
                    Começar a reduzir isso
                  </Link>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/*
          Sem esta linha, o número acima insinua "o Crivo recupera tudo isso" —
          promessa que nenhum produto cumpre e que nós não medimos.
        */}
        <ScrollReveal direction="up" delay={400} duration={700}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
            A conta usa os seus números e considera{" "}
            {WEEKS_PER_MONTH.toLocaleString("pt-BR")} semanas por mês. Nenhuma
            ferramenta zera as faltas — o Crivo age sobre as
            que dá para evitar: lembra quem tende a faltar, avisa a recepção
            quando a mensagem não chega e oferece a vaga a quem está esperando.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};
