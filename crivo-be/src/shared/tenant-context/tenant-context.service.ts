export type TenantContext = {
  readonly tenantId: string;
  readonly userId: string;
  readonly planType: any;
};

declare module 'express' {
  interface Request {
    tenantContext?: TenantContext;
  }
}
