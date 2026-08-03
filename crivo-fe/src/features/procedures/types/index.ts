export type Procedure = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceInCents: number;
  isActive: boolean;
  createdAt: string;
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
