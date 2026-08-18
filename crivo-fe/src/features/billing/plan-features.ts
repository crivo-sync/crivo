import type { Plan } from "./types";

export type PlanFeatureLine = {
  text: string;
  included: boolean;
  /**
   * Marca as linhas cujo **valor muda** de plano para plano (limite de
   * profissionais, franquia de mensagens), diferente das que são só ✓/✗.
   *
   * Os cards compactos usam isto para decidir o que cabe no corte: uma
   * linha idêntica nas quatro colunas não ajuda a escolher, mas uma que
   * varia é exatamente o que separa um plano do outro.
   */
  varies?: boolean;
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
  if (plan.maxProfessionals === null) {
    return "Profissionais ilimitados";
  }

  /**
   * Só "até N profissionais" — sem preço de adicional.
   *
   * Chegou a mostrar "depois R$X/mês cada" entre 17/08/2026 e o mesmo dia,
   * quando `CreateProfessionalUseCase` cobrava o adicional de verdade em vez
   * de recusar o cadastro acima do teto. Essa cobrança automática tinha um
   * bug que removia o limite do plano na prática (uma clínica real foi de 2
   * para 3 profissionais no Essencial sem nenhum bloqueio) e foi revertida
   * no mesmo dia: `CreateProfessionalUseCase` volta a recusar sempre acima
   * do teto. Anunciar o adicional aqui de novo seria a mesma divergência
   * site×sistema que a auditoria de 13/08 existiu para remover — o único
   * caminho para crescer além do teto é assinar um plano maior.
   */
  return plan.maxProfessionals === 1
    ? "1 profissional"
    : `${plan.maxProfessionals} profissionais`;
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
    { text: "Mensagens reescritas por IA", included: plan.hasAiMessages },
    { text: "Painel com gráficos e faturamento", included: plan.hasDashboard },

    /**
     * Base comum a todos os planos.
     *
     * Prontuário e fotos **saíram da parte paga** em 14/08/2026: viraram
     * commodity (o concorrente de R$ 39,90 já entrega os dois), e cobrar por
     * eles nos deixava piores na comparação exatamente onde o cliente olha
     * primeiro. Continuam com linha própria — para clínica de estética o
     * antes/depois é o argumento de venda, e diluí-lo dentro de "Prontuário"
     * esconderia o que mais interessa.
     */
    { text: "Prontuário (anamnese e evolução)", included: true },
    { text: "Fotos antes/depois por atendimento", included: true },
    { text: "Agenda com controle de conflito de horário", included: true },
    { text: messagesQuotaLabel(plan), included: true, varies: true },
    { text: "Confirmação por link ou respondendo no WhatsApp", included: true },
    { text: "Agendamento online pelo paciente", included: true },
  ];
}

/**
 * A franquia virou informação de compra, não letra miúda.
 *
 * Cada mensagem tem custo real (a Meta cobra por mensagem de utilidade), e
 * esconder o teto criaria a surpresa que o produto existe para evitar.
 */
function messagesQuotaLabel(plan: Plan): string {
  if (plan.maxMessagesPerMonth === null) {
    return "Lembretes automáticos de WhatsApp";
  }

  return `${plan.maxMessagesPerMonth.toLocaleString("pt-BR")} mensagens de WhatsApp por mês`;
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
    { text: professionalsLimitLabel(plan), included: true, varies: true },
    ...planComparableFeatures(plan),
  ];
}
