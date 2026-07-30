import { Role } from '@prisma/client';

export type TenantContext = {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: Role;
};

/** O que a JwtStrategy devolve e o Passport injeta em `req.user`. */
export type AuthenticatedUser = {
  userId: string;
  tenantId: string;
  role: Role;
};

declare module 'express' {
  interface Request {
    tenantContext?: TenantContext;
    user?: AuthenticatedUser;
  }
}
