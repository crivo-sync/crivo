import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import { welcomeMail } from 'src/modules/mail/application/templates';

export type RegisterInput = {
  tenantName: string;
  subdomain: string;
  name: string;
  email: string;
  /** WhatsApp da clínica, só dígitos. É por onde o Crivo fala com ela. */
  phone: string;
  password: string;
};

const SALT_ROUNDS = 10;

/// Único plano hoje: 14 dias de trial, sem cartão. Planos pagos e preço
/// entram depois, manualmente, quando o Stripe estiver configurado.
const TRIAL_DAYS = 14;

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

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

    const created = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          subdomain: input.subdomain,
          phone: input.phone,
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

    // Fora da transação de propósito: mandar e-mail é chamada de rede
    // externa, e segurar uma conexão do banco esperando SMTP é o tipo de
    // coisa que derruba o pool sob carga. `MailService.send` nunca lança —
    // falha de e-mail não pode impedir a criação da conta.
    const appUrl =
      this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3000';

    await this.mail.send(
      created.user.email,
      welcomeMail({
        clinicName: created.tenant.name,
        bookingUrl: `${appUrl.replace(/\/$/, '')}/agendar/${created.tenant.subdomain}`,
        trialDays: TRIAL_DAYS,
      }),
    );

    return created;
  }
}
