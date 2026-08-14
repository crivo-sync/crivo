"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Plan } from "@/features/billing/types";

/**
 * Qual plano serve para o tamanho da minha clínica?
 *
 * Sem isto, escolher exige comparar quatro colunas de onze linhas e ainda
 * adivinhar se a franquia de mensagens dá conta — a informação está toda
 * lá, mas o trabalho de cruzar sobra para o visitante. Aqui ele informa dois
 * números que sabe de cabeça e o plano se aponta sozinho.
 *
 * **A recomendação sai do `GET /plans`, não de tabela local.** Se o preço
 * mudar no Stripe, esta tela muda junto — a mesma regra do resto do site.
 */

/**
 * Mensagens por atendimento: um aviso de marcação + um a dois lembretes
 * (risco alto recebe D-72h **e** D-24h, ver `REMINDER_HOURS_BY_RISK`).
 * 2,5 é a média entre quem recebe um e quem recebe dois.
 */
const MENSAGENS_POR_ATENDIMENTO = 2.5;

const LIMITES = {
  profissionais: { min: 1, max: 30 },
  atendimentos: { min: 0, max: 2000 },
};

function clamp(valor: number, { min, max }: { min: number; max: number }) {
  if (Number.isNaN(valor)) return min;
  return Math.min(Math.max(valor, min), max);
}

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

export const PlanCalculator = ({ plans }: { plans: Plan[] }) => {
  const [profissionais, setProfissionais] = useState(2);
  const [atendimentosPorProfissional, setAtendimentos] = useState(120);

  const { recomendado, mensagensNecessarias, semPlanoSuficiente } =
    useMemo(() => {
      const mensagens = Math.round(
        profissionais * atendimentosPorProfissional * MENSAGENS_POR_ATENDIMENTO,
      );

      /**
       * Precisa caber nas **duas** dimensões: número de profissionais e
       * franquia de mensagem. Recomendar por uma só levaria a clínica a um
       * plano onde ela não consegue cadastrar a equipe, ou onde as mensagens
       * acabam no meio do mês — os dois casos viram cancelamento.
       */
      const ordenados = [...plans].sort(
        (a, b) => a.priceInCents - b.priceInCents,
      );

      const cabe = ordenados.find((plan) => {
        const cabemProfissionais =
          plan.maxProfessionals === null ||
          plan.maxProfessionals >= profissionais;
        const cabemMensagens =
          plan.maxMessagesPerMonth === null ||
          plan.maxMessagesPerMonth >= mensagens;

        return cabemProfissionais && cabemMensagens;
      });

      return {
        recomendado: cabe ?? ordenados[ordenados.length - 1],
        mensagensNecessarias: mensagens,
        semPlanoSuficiente: !cabe,
      };
    }, [plans, profissionais, atendimentosPorProfissional]);

  if (plans.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <ScrollReveal direction="up" delay={50} duration={600}>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Qual plano serve para a{" "}
              <span className="bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                sua clínica
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Dois números que você já sabe. Nós indicamos o plano que cabe.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150} duration={700}>
          <div className="grid gap-8 rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent p-8 backdrop-blur-sm md:grid-cols-[1fr_1fr] md:p-10">
            <div className="flex flex-col justify-center gap-7">
              <div>
                <label
                  htmlFor="profissionais"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Profissionais que atendem
                </label>
                <p className="mt-1 mb-3 text-xs text-gray-500">
                  Quem tem agenda própria na clínica.
                </p>
                <input
                  id="profissionais"
                  type="number"
                  inputMode="numeric"
                  min={LIMITES.profissionais.min}
                  max={LIMITES.profissionais.max}
                  value={profissionais}
                  onChange={(event) =>
                    setProfissionais(
                      clamp(event.target.valueAsNumber, LIMITES.profissionais),
                    )
                  }
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-lg font-semibold text-gray-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="atendimentos"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Atendimentos por profissional, no mês
                </label>
                <p className="mt-1 mb-3 text-xs text-gray-500">
                  É daqui que sai o número de mensagens.
                </p>
                <input
                  id="atendimentos"
                  type="number"
                  inputMode="numeric"
                  min={LIMITES.atendimentos.min}
                  max={LIMITES.atendimentos.max}
                  value={atendimentosPorProfissional}
                  onChange={(event) =>
                    setAtendimentos(
                      clamp(event.target.valueAsNumber, LIMITES.atendimentos),
                    )
                  }
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-lg font-semibold text-gray-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <p className="text-xs leading-relaxed text-gray-500">
                Cada atendimento gasta ~
                {MENSAGENS_POR_ATENDIMENTO.toLocaleString("pt-BR")} mensagens
                (aviso de marcação + lembrete; quem tende a faltar recebe dois).
                Sua operação:{" "}
                <strong className="text-gray-700">
                  ~{mensagensNecessarias.toLocaleString("pt-BR")} mensagens/mês
                </strong>
                .
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-7 text-center">
              {semPlanoSuficiente ? (
                /* Empurrar para o maior plano sabendo que ele não comporta
                   seria vender um cancelamento. */
                <>
                  <p className="text-sm font-medium text-gray-600">
                    Sua operação é maior que os planos padrão
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-gray-700">
                    Fale com a gente: montamos o plano no tamanho da sua
                    clínica.
                  </p>
                  <Link
                    href="/#contato"
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-500"
                  >
                    Falar com a gente
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">
                    O plano que cabe é o
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                    {recomendado.name}
                  </p>
                  <p className="mt-3 bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
                    {formatBRL(recomendado.priceInCents)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">por mês</p>

                  <div className="mx-auto my-6 h-px w-16 bg-black/10" />

                  <p className="text-sm leading-relaxed text-gray-600">
                    {recomendado.maxMessagesPerMonth === null
                      ? "Mensagens sem limite"
                      : `${recomendado.maxMessagesPerMonth.toLocaleString("pt-BR")} mensagens inclusas`}
                    {recomendado.maxMessagesPerMonth !== null && (
                      <>
                        {" — "}
                        <strong className="text-gray-900">
                          sobram{" "}
                          {(
                            recomendado.maxMessagesPerMonth -
                            mensagensNecessarias
                          ).toLocaleString("pt-BR")}
                        </strong>{" "}
                        de folga
                      </>
                    )}
                  </p>

                  <Link
                    href="/cadastro"
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(79,70,229,0.25)] transition-all duration-300 hover:bg-indigo-500"
                  >
                    Testar 14 dias grátis
                  </Link>
                  <p className="mt-3 text-xs text-gray-500">
                    Sem cartão de crédito.
                  </p>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
