import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import { trialEndingMail } from 'src/modules/mail/application/templates';

/** Quantos dias antes do fim o aviso sai. */
export const NOTIFY_DAYS_BEFORE = 3;

/**
 * Avisa por e-mail quem está a `NOTIFY_DAYS_BEFORE` dias do fim do teste.
 *
 * O banner de trial só aparece **dentro do painel**: quem parou de entrar não
 * sabe que vai perder o acesso e descobre com a agenda travada — justamente
 * quem mais precisa do empurrão para assinar.
 *
 * Roda uma vez por dia e pega a janela de um dia (`>= início do dia D+3` e
 * `< início do dia D+4`). Sem a janela fechada, o mesmo tenant receberia o
 * aviso em todas as execuções até vencer.
 */
@Injectable()
export class NotifyEndingTrialsUseCase {
  private readonly logger = new Logger(NotifyEndingTrialsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async execute(): Promise<number> {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() + NOTIFY_DAYS_BEFORE);

    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { gte: from, lt: to },
      },
      select: {
        name: true,
        users: {
          where: { role: 'ADMIN', isActive: true },
          select: { email: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const appUrl =
      this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3000';

    let enviados = 0;

    for (const tenant of tenants) {
      const email = tenant.users[0]?.email;
      if (!email) continue;

      await this.mail.send(
        email,
        trialEndingMail({
          clinicName: tenant.name,
          daysLeft: NOTIFY_DAYS_BEFORE,
          plansUrl: `${appUrl.replace(/\/$/, '')}/painel/configuracoes`,
        }),
      );

      enviados += 1;
    }

    if (enviados > 0) {
      this.logger.log(`${enviados} aviso(s) de trial acabando enviados.`);
    }

    return enviados;
  }
}
