import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe a rota (ou o controller inteiro) aos papéis informados.
 * Exige que RolesGuard esteja aplicado junto do JwtAuthGuard.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
