"use client";

import Skeleton from "@mui/material/Skeleton";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { planComparableFeatures } from "@/features/billing/plan-features";
import { usePlans } from "@/features/billing/hooks/use-plans";

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

/**
 * Tabela montada a partir de `GET /plans`, não de uma cópia hardcoded.
 *
 * Antes as linhas viviam aqui à mão e divergiam do banco a cada feature
 * nova — a tabela chegou a não citar prontuário nem painel enquanto os
 * planos já os diferenciavam. Como as linhas vêm de
 * `planComparableFeatures`, a mesma fonte dos cards, as duas nunca mais
 * discordam.
 */
export const ComparisonNote = () => {
  const { plans, isLoading } = usePlans();

  // Os rótulos são os mesmos para todo plano (só o `included` muda), então
  // o primeiro serve de eixo das linhas.
  const rowLabels = plans[0]
    ? planComparableFeatures(plans[0]).map((f) => f.text)
    : [];
  const includedByPlan = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    // Só o número (ou "Ilimitados") — a coluna já se chama "Profissionais".
    professionals:
      plan.maxProfessionals === null ? "Ilimitados" : String(plan.maxProfessionals),
    included: new Map(
      planComparableFeatures(plan).map((line) => [line.text, line.included]),
    ),
  }));

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

        {isLoading ? (
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: 6 }} />
        ) : (
          <ScrollReveal
            direction="up"
            delay={200}
            duration={800}
            className="overflow-hidden rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent backdrop-blur-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      Recurso
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-emerald-700">
                      Teste
                    </th>
                    {includedByPlan.map((plan) => (
                      <th
                        key={plan.id}
                        className="px-4 py-4 text-center text-sm font-bold text-indigo-600"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Limite de profissionais é valor, não sim/não — mostra o
                      número de cada plano. Com ✓/✗ o "Até 2" ficaria marcado
                      no Básico e riscado nos maiores, lendo ao contrário. */}
                  <tr className="border-b border-black/5 transition-colors hover:bg-black/1.5">
                    <td className="px-6 py-3.5 text-gray-700">Profissionais</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">
                      Ilimitados
                    </td>
                    {includedByPlan.map((plan) => (
                      <td
                        key={plan.id}
                        className="px-4 py-3.5 text-center text-gray-600"
                      >
                        {plan.professionals}
                      </td>
                    ))}
                  </tr>
                  {rowLabels.map((label) => (
                    <tr
                      key={label}
                      className="border-b border-black/5 transition-colors last:border-0 hover:bg-black/1.5"
                    >
                      <td className="px-6 py-3.5 text-gray-700">{label}</td>
                      {/* No teste tudo fica liberado — o trial não passa por
                          `PlanFeatureGuard` (tenant sem plano sempre passa). */}
                      <td className="px-4 py-3.5">
                        <Cell included />
                      </td>
                      {includedByPlan.map((plan) => (
                        <td key={plan.id} className="px-4 py-3.5">
                          <Cell included={plan.included.get(label) ?? false} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}

        {/* Notes */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Teste antes de pagar",
              description: "14 dias com tudo liberado, sem pedir cartão",
            },
            {
              title: "O teste não é plano grátis",
              description:
                "depois dos 14 dias você escolhe um plano — WhatsApp e predição têm custo real por clínica",
            },
            {
              title: "Preço por profissional",
              description: "não por agendamento — conta previsível todo mês",
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
