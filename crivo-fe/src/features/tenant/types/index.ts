/** Caminho de envio do WhatsApp. Credenciais ficam no servidor. */
export type MessagingProvider = "FAKE" | "EVOLUTION" | "META";

/** Só `TRIALING` e `EXPIRED` acontecem hoje — os demais existem no backend
 * para quando o Stripe entrar. */
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";

export type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  aiMessagesEnabled: boolean;
  /**
   * Por onde o WhatsApp desta clínica sai. `null` = usa o padrão do
   * servidor; as credenciais ficam em variáveis de ambiente, não aqui.
   */
  messagingProvider: MessagingProvider | null;
  /** Abertura da clínica em minutos desde a meia-noite (480 = 08:00). */
  businessHoursStart: number;
  /** Fechamento da clínica em minutos desde a meia-noite (1080 = 18:00). */
  businessHoursEnd: number;
  /** Dias de funcionamento na convenção `Date.getDay()` (0 = domingo). */
  businessDays: number[];
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  /** `null` enquanto o tenant está em trial — nenhum checkout foi concluído ainda. */
  planId: string | null;
  /**
   * Features do plano contratado. `null` em trial, que libera tudo.
   *
   * Serve para **esconder** o que o backend recusaria — é conveniência de
   * UI, não segurança: quem manda é o `PlanFeatureGuard`.
   */
  plan: PlanFeatures | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * O que falta para a clínica começar a operar. Clínica nova nasce sem
 * profissional e sem procedimento, e sem os dois a agenda não calcula
 * horário nem a página `/agendar` funciona.
 */
export type OnboardingStatus = {
  hasProfessional: boolean;
  hasProcedure: boolean;
  hasAppointment: boolean;
  /** Para montar o link do `/agendar` que a clínica divulga. */
  subdomain: string;
  isComplete: boolean;
};

export type PlanFeatures = {
  name: string;
  hasPrediction: boolean;
  hasWaitlist: boolean;
  hasDashboard: boolean;
  hasMedicalRecords: boolean;
  hasAiMessages: boolean;
  maxProfessionals: number | null;
  maxMessagesPerMonth: number | null;
};

/**
 * Conexão do WhatsApp da clínica (pareamento por QR code).
 *
 * Não traz o nome da instância de propósito: é detalhe do servidor Evolution
 * e não ajuda a clínica em nada — mas ajudaria quem quisesse alcançar a
 * instância de outra.
 */
export type WhatsAppConnection = {
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED";
  /** Data URI do QR, presente só enquanto o pareamento está pendente. */
  qrCode: string | null;
  /** Número conectado, para a clínica conferir que pareou o telefone certo. */
  phone: string | null;
  profileName: string | null;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
