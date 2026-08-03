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
  createdAt: string;
  updatedAt: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
