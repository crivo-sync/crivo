export type Professional = {
  id: string;
  tenantId: string;
  name: string;
  specialty: string | null;
  councilCode: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  /** Procedimentos que este profissional realiza. Vazio = realiza todos. */
  procedures: { id: string; name: string }[];
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
