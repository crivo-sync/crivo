import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingProvider } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { MessageProvider } from '../../domain/provider/message-provider';
import { EvolutionMessageProvider } from '../../infrastructure/providers/evolution-message.provider';
import { FakeMessageProvider } from '../../infrastructure/providers/fake-message.provider';
import { MetaMessageProvider } from '../../infrastructure/providers/meta-message.provider';

/**
 * Escolhe por onde o WhatsApp de cada clínica sai.
 *
 * Antes o provider era único para o processo inteiro (`MESSAGING_PROVIDER`),
 * o que impedia uma clínica de usar a Meta oficial enquanto outra segue na
 * Evolution — e é exatamente essa a transição em curso, já que a Meta cobra
 * por conversa e vai entrando aos poucos.
 *
 * `Tenant.messagingProvider` nulo mantém o comportamento antigo: usa o
 * padrão do servidor. As credenciais continuam em variáveis de ambiente; a
 * clínica escolhe o caminho, não guarda segredo no banco.
 */
@Injectable()
export class MessageProviderResolver {
  private readonly logger = new Logger(MessageProviderResolver.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly fake: FakeMessageProvider,
    private readonly evolution: EvolutionMessageProvider,
    private readonly meta: MetaMessageProvider,
  ) {}

  async resolveForTenant(tenantId: string): Promise<MessageProvider> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { messagingProvider: true },
    });

    return this.byName(tenant?.messagingProvider ?? this.serverDefault());
  }

  /** Padrão do servidor, para quem ainda não escolheu. */
  private serverDefault(): MessagingProvider {
    const configured = (
      this.config.get<string>('MESSAGING_PROVIDER') ?? 'fake'
    ).toUpperCase();

    if (configured === 'META') return MessagingProvider.META;
    if (configured === 'EVOLUTION') return MessagingProvider.EVOLUTION;
    return MessagingProvider.FAKE;
  }

  private byName(provider: MessagingProvider): MessageProvider {
    switch (provider) {
      case MessagingProvider.META:
        return this.meta;
      case MessagingProvider.EVOLUTION:
        return this.evolution;
      default:
        return this.fake;
    }
  }
}
