import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as
      | { userId: string; tenantId: string; role: string }
      | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'Tenant context not available. Ensure JwtAuthGuard runs before TenantContextGuard.',
      );
    }

    req.tenantContext = {
      tenantId: user.tenantId,
      userId: user.userId,
      planType: undefined,
    };

    return true;
  }
}
