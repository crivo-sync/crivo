import type { Plan } from "./types";

export type PlanFeatureLine = {
  text: string;
  included: boolean;
};

/**
 * Texto do limite de profissionais.
 *
 * É um **valor**, não um sim/não — muda de plano para plano ("Até 2" vs
 * "ilimitados"). Numa lista simples funciona como item; numa tabela
 * comparativa, onde a linha é a mesma para todas as colunas, "Até 2
 * profissional(is)" apareceria com ✓ no Básico e ✗ nos planos maiores,
 * lendo como se os caros tivessem menos. Por isso a tabela usa
 * `planComparableFeatures` (só booleanos) e mostra este texto à parte.
 */
export function professionalsLimitLabel(plan: Plan): string {
  return plan.maxProfessionals === null
    ? "Profissionais ilimitados"
    : `Até ${plan.maxProfessionals} profissional(is)`;
}

/**
 * Só as features booleanas, em ordem de relevância comercial: **o que
 * diferencia vem primeiro**.
 *
 * Essa ordem não é estética. Os cards compactos (home do site) cortam a
 * lista nos primeiros itens — com as features comuns no topo, as três
 * colunas mostravam exatamente as mesmas linhas e nenhum diferencial
 * aparecia. O que separa um plano do outro precisa caber no corte.
 *
 * Itens não inclusos **continuam na lista**, marcados com `included:
 * false`, em vez de sumirem: uma coluna que esconde o que falta não
 * ajuda ninguém a escolher entre planos.
 */
export function planComparableFeatures(plan: Plan): PlanFeatureLine[] {
  return [
    // Diferenciais primeiro — é o que decide a compra.
    // "Predição de risco de no-show" era o texto anterior: jargão numa linha
    // que a pessoa lê para decidir onde gastar. O nome bate com a aba do
    // painel ("Risco de falta") e diz o que ela ganha com isso.
    {
      text: "Risco de falta: saiba para quem ligar amanhã",
      included: plan.hasPrediction,
    },
    { text: "Lista de espera com aviso automático", included: plan.hasWaitlist },
    {
      text: "Prontuário (anamnese e evolução)",
      included: plan.hasMedicalRecords,
    },
    /**
     * Linha própria, embora compartilhe a flag do prontuário: para clínica de
     * estética o antes/depois é o argumento de venda, e escondê-lo dentro de
     * "Prontuário" faria o comprador não ver o que mais lhe interessa.
     */
    {
      text: "Fotos antes/depois por atendimento",
      included: plan.hasMedicalRecords,
    },
    { text: "Mensagens reescritas por IA", included: plan.hasAiMessages },
    { text: "Painel com gráficos e faturamento", included: plan.hasDashboard },

    // Base comum a todos os planos, no fim da lista.
    { text: "Agenda com controle de conflito de horário", included: true },
    { text: "Lembretes automáticos de WhatsApp", included: true },
    { text: "Confirmação por link ou respondendo no WhatsApp", included: true },
    { text: "Agendamento online pelo paciente", included: true },
  ];
}

/**
 * Lista completa para os **cards** de plano: o limite de profissionais no
 * topo (é o primeiro critério que a clínica olha) seguido das features.
 *
 * Fonte única para o painel (Configurações → Assinatura) e para o site
 * institucional — antes cada um montava a sua e as duas divergiram, o que
 * gerou dois bugs diferentes na mesma informação.
 */
export function planFeatureLines(plan: Plan): PlanFeatureLine[] {
  return [
    { text: professionalsLimitLabel(plan), included: true },
    ...planComparableFeatures(plan),
  ];
}
