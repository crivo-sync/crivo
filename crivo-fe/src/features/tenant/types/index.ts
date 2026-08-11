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
  createdAt: string;
  updatedAt: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
