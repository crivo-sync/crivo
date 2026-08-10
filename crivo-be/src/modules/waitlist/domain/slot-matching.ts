/**
 * Quem, da fila, serve para uma vaga que abriu.
 *
 * A regra é conservadora de propósito: oferecer uma vaga que não serve gasta
 * a conversa (paga) e ensina o paciente a ignorar as mensagens da clínica.
 * Melhor não oferecer do que oferecer errado.
 */

export type OpenSlot = {
  professionalId: string;
  procedureId: string;
  startsAt: Date;
  endsAt: Date;
};

export type WaitlistCandidate = {
  id: string;
  procedureId: string;
  /** `null` = aceita qualquer profissional. */
  professionalId: string | null;
  preferredFrom: Date | null;
  preferredTo: Date | null;
  createdAt: Date;
};

/**
 * O candidato aceita esta vaga?
 *
 * Três condições, todas necessárias:
 * - **mesmo procedimento** — a duração da vaga foi definida pelo
 *   procedimento cancelado; outro procedimento pode não caber;
 * - **profissional compatível** — quem escolheu alguém específico não é
 *   encaixado com outro; quem não escolheu aceita qualquer um;
 * - **dentro da janela** que ele mesmo declarou.
 */
export function acceptsSlot(
  candidate: WaitlistCandidate,
  slot: OpenSlot,
): boolean {
  if (candidate.procedureId !== slot.procedureId) return false;

  if (
    candidate.professionalId !== null &&
    candidate.professionalId !== slot.professionalId
  ) {
    return false;
  }

  if (candidate.preferredFrom && slot.startsAt < candidate.preferredFrom) {
    return false;
  }

  // Compara com o INÍCIO da vaga, não com o fim: o paciente disse até quando
  // aceita ser atendido, e um atendimento que começa dentro da janela é
  // aceitável mesmo que termine alguns minutos depois dela.
  if (candidate.preferredTo && slot.startsAt > candidate.preferredTo) {
    return false;
  }

  return true;
}

/**
 * Fila ordenada para uma vaga: quem entrou primeiro tem preferência.
 *
 * Ordem de chegada, e não "quem tem menos risco de faltar": a lista de
 * espera é uma promessa de justiça para o paciente, e furar a fila por um
 * critério interno da clínica é o tipo de coisa que ele percebe e reclama.
 */
export function rankCandidates(
  candidates: WaitlistCandidate[],
  slot: OpenSlot,
): WaitlistCandidate[] {
  return candidates
    .filter((candidate) => acceptsSlot(candidate, slot))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
