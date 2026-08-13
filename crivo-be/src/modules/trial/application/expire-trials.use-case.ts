import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

/**
 * Marca como `EXPIRED` todo trial que já venceu.
 *
 * O `SubscriptionGuard` já faz isso em request-time, mas só para quem
 * *tenta usar* o sistema: uma clínica que parou de entrar fica com o
 * status desatualizado no banco por tempo indeterminado. Isso distorce
 * qualquer contagem de "quantos trials venceram" e deixa o dado errado
 * para quem for consultá-lo fora de uma requisição.
 *
 * Idempotente: rodar duas vezes no mesmo dia não muda nada, porque o
 * `where` já exclui quem está `EXPIRED`.
 */
@Injectable()
export class ExpireTrialsUseCase {
  private readonly logger = new Logger(ExpireTrialsUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<{ expired: number }> {
    const { count } = await this.prisma.tenant.updateMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: { lt: new Date() },
      },
      data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
    });

    if (count > 0) {
      this.logger.log(`${count} trial(is) marcado(s) como EXPIRED.`);
    }

    return { expired: count };
  }
}
