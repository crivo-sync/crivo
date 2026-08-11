import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

export type RegisterInput = {
  tenantName: string;
  subdomain: string;
  name: string;
  email: string;
  password: string;
};

const SALT_ROUNDS = 10;

/// Único plano hoje: 14 dias de trial, sem cartão. Planos pagos e preço
/// entram depois, manualmente, quando o Stripe estiver configurado.
const TRIAL_DAYS = 14;

@Injectable()
export class RegisterUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: RegisterInput) {
    const [existingTenant, existingUser] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { subdomain: input.subdomain },
      }),
      this.prisma.user.findUnique({ where: { email: input.email } }),
    ]);

    if (existingTenant) {
      throw new ConflictException('Subdomain already in use.');
    }

    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          subdomain: input.subdomain,
          trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      return { tenant, user };
    });
  }
}
