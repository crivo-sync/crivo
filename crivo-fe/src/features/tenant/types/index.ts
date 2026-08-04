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
  /** Abertura da clínica em minutos desde a meia-noite (480 = 08:00). */
  businessHoursStart: number;
  /** Fechamento da clínica em minutos desde a meia-noite (1080 = 18:00). */
  businessHoursEnd: number;
  /** Dias de funcionamento na convenção `Date.getDay()` (0 = domingo). */
  businessDays: number[];
  createdAt: string;
  updatedAt: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
