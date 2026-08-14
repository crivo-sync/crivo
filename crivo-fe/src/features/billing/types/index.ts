export type Plan = {
  id: string;
  key: string;
  name: string;
  priceInCents: number;
  /** Profissionais **incluídos** na mensalidade. `null` = sem limite. */
  maxProfessionals: number | null;
  /**
   * Quanto custa cada profissional além dos incluídos. `null` = a faixa não
   * aceita adicional (o plano de entrada, de um profissional só).
   */
  pricePerExtraProfessionalInCents: number | null;
  /** Mensagens de WhatsApp por mês. `null` = sem teto. */
  maxMessagesPerMonth: number | null;
  hasPrediction: boolean;
  hasAiMessages: boolean;
  hasWaitlist: boolean;
  hasDashboard: boolean;
  hasMedicalRecords: boolean;
  isActive: boolean;
};

/**
 * Assinar um plano dá em dois caminhos diferentes:
 *
 * - **`checkout`**: primeira assinatura — vai para o Stripe pagar.
 * - **`changed`**: já existe assinatura, e o backend trocou o preço dela.
 *   Não sai da aplicação; a troca já aconteceu (upgrade) ou ficou agendada
 *   para o fim do ciclo pago (downgrade).
 */
export type CheckoutSession =
  | { kind: "checkout"; url: string }
  | { kind: "changed"; message: string };

export type MessageUsage = {
  used: number;
  /** `null` = sem teto (plano Avançado). */
  limit: number | null;
  isTrial: boolean;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
