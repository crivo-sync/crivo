import { ConfigService } from '@nestjs/config';
import { MessagingProvider } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { EvolutionMessageProvider } from '../../infrastructure/providers/evolution-message.provider';
import { FakeMessageProvider } from '../../infrastructure/providers/fake-message.provider';
import { MetaMessageProvider } from '../../infrastructure/providers/meta-message.provider';
import { MessageProviderResolver } from './message-provider-resolver.service';

function makeResolver(tenant: {
  messagingProvider: MessagingProvider | null;
  evolutionInstance: string | null;
} | null) {
  const prisma = {
    tenant: { findUnique: jest.fn().mockResolvedValue(tenant) },
  } as unknown as PrismaService;

  const config = {
    get: jest.fn().mockReturnValue('evolution'),
  } as unknown as ConfigService;

  const fake = { name: 'fake' } as unknown as FakeMessageProvider;
  const evolution = { name: 'evolution' } as unknown as EvolutionMessageProvider;
  const meta = { name: 'meta' } as unknown as MetaMessageProvider;

  return new MessageProviderResolver(prisma, config, fake, evolution, meta);
}

describe('MessageProviderResolver — número por clínica', () => {
  /**
   * O ponto central do multi-tenant na mensageria: cada clínica envia pelo
   * **seu** número. Sem isso o paciente da Clínica A receberia mensagem do
   * WhatsApp da Clínica B.
   */
  it('devolve a instância da própria clínica', async () => {
    const resolver = makeResolver({
      messagingProvider: MessagingProvider.EVOLUTION,
      evolutionInstance: 'clinica-sorriso',
    });

    const { sender } = await resolver.resolveForTenant('tenant-1');

    expect(sender.evolutionInstance).toBe('clinica-sorriso');
  });

  it('clínicas diferentes recebem instâncias diferentes', async () => {
    const a = makeResolver({
      messagingProvider: MessagingProvider.EVOLUTION,
      evolutionInstance: 'clinica-a',
    });
    const b = makeResolver({
      messagingProvider: MessagingProvider.EVOLUTION,
      evolutionInstance: 'clinica-b',
    });

    const senderA = (await a.resolveForTenant('tenant-a')).sender;
    const senderB = (await b.resolveForTenant('tenant-b')).sender;

    expect(senderA.evolutionInstance).not.toBe(senderB.evolutionInstance);
  });

  it('sem instância própria, cai no padrão do servidor (null)', async () => {
    const resolver = makeResolver({
      messagingProvider: MessagingProvider.EVOLUTION,
      evolutionInstance: null,
    });

    const { sender } = await resolver.resolveForTenant('tenant-1');

    // `null` faz o provider usar `EVOLUTION_INSTANCE` — aceitável só
    // enquanto existe uma clínica.
    expect(sender.evolutionInstance).toBeNull();
  });

  it('provider e remetente vêm juntos, na mesma consulta', async () => {
    const resolver = makeResolver({
      messagingProvider: MessagingProvider.EVOLUTION,
      evolutionInstance: 'clinica-x',
    });

    const resolved = await resolver.resolveForTenant('tenant-1');

    // São a mesma decisão: acertar o caminho e errar o número faria a
    // mensagem sair pelo WhatsApp de outra clínica.
    expect(resolved.provider.name).toBe('evolution');
    expect(resolved.sender.evolutionInstance).toBe('clinica-x');
  });

  it('tenant inexistente não quebra — cai no padrão', async () => {
    const resolver = makeResolver(null);

    const { sender, provider } = await resolver.resolveForTenant('sumiu');

    expect(sender.evolutionInstance).toBeNull();
    expect(provider.name).toBe('evolution');
  });
});
