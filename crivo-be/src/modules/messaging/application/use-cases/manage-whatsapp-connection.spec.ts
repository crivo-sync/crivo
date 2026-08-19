import { NotFoundException } from '@nestjs/common';
import { MessagingProvider } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import type { EvolutionInstanceClient } from '../../infrastructure/providers/evolution-instance.client';
import { ManageWhatsAppConnectionUseCase } from './manage-whatsapp-connection.use-case';

const TENANT_ID = 'tenant-abc';

type EvolutionStub = Partial<Record<keyof EvolutionInstanceClient, jest.Mock>>;

function makeUseCase(
  tenant: { id: string; evolutionInstance: string | null } | null,
  evolution: EvolutionStub = {},
) {
  const update = jest.fn().mockResolvedValue({});

  const prisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue(tenant),
      update,
    },
  } as unknown as PrismaService;

  const client = {
    status: jest.fn().mockResolvedValue({
      exists: false,
      state: null,
      phone: null,
      profileName: null,
    }),
    create: jest
      .fn()
      .mockResolvedValue({ qrCode: 'data:image/png;base64,AAA' }),
    connect: jest
      .fn()
      .mockResolvedValue({ qrCode: 'data:image/png;base64,BBB' }),
    logout: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    ...evolution,
  } as unknown as EvolutionInstanceClient;

  return {
    useCase: new ManageWhatsAppConnectionUseCase(prisma, client),
    client: client as unknown as Required<EvolutionStub>,
    update,
  };
}

describe('ManageWhatsAppConnectionUseCase', () => {
  describe('connect', () => {
    it('deriva o nome da instância do tenant — a clínica não escolhe', async () => {
      const { useCase, client } = makeUseCase({
        id: TENANT_ID,
        evolutionInstance: null,
      });

      await useCase.connect(TENANT_ID);

      // Este é o ponto da mudança: antes o nome vinha digitado num campo de
      // texto, o que permitia apontar para a instância de outra clínica.
      expect(client.create).toHaveBeenCalledWith(`crivo-${TENANT_ID}`);
    });

    it('grava o vínculo e liga o provider Evolution', async () => {
      const { useCase, update } = makeUseCase({
        id: TENANT_ID,
        evolutionInstance: null,
      });

      await useCase.connect(TENANT_ID);

      // Sem marcar o provider, o pareamento não teria efeito nenhum: o envio
      // continuaria caindo no padrão do servidor.
      expect(update).toHaveBeenCalledWith({
        where: { id: TENANT_ID },
        data: {
          evolutionInstance: `crivo-${TENANT_ID}`,
          messagingProvider: MessagingProvider.EVOLUTION,
        },
      });
    });

    it('instância que já existe pede QR novo, não recria', async () => {
      const { useCase, client } = makeUseCase(
        { id: TENANT_ID, evolutionInstance: `crivo-${TENANT_ID}` },
        {
          status: jest.fn().mockResolvedValue({
            exists: true,
            state: 'close',
            phone: null,
            profileName: null,
          }),
        },
      );

      const result = await useCase.connect(TENANT_ID);

      expect(client.connect).toHaveBeenCalled();
      expect(client.create).not.toHaveBeenCalled();
      expect(result.qrCode).toBe('data:image/png;base64,BBB');
    });

    it('já conectado não derruba a sessão para mostrar QR', async () => {
      const { useCase, client } = makeUseCase(
        { id: TENANT_ID, evolutionInstance: `crivo-${TENANT_ID}` },
        {
          status: jest.fn().mockResolvedValue({
            exists: true,
            state: 'open',
            phone: '5511999998888',
            profileName: 'Clínica Sorriso',
          }),
        },
      );

      const result = await useCase.connect(TENANT_ID);

      expect(result.status).toBe('CONNECTED');
      expect(result.qrCode).toBeNull();
      // Pedir QR aqui desconectaria o número que já está funcionando.
      expect(client.connect).not.toHaveBeenCalled();
      expect(client.create).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('clínica que nunca pareou aparece como desconectada', async () => {
      const { useCase, client } = makeUseCase({
        id: TENANT_ID,
        evolutionInstance: null,
      });

      const result = await useCase.getStatus(TENANT_ID);

      expect(result.status).toBe('DISCONNECTED');
      // Sem instância no banco não há o que perguntar ao servidor.
      expect(client.status).not.toHaveBeenCalled();
    });

    it('devolve o número conectado para a clínica conferir', async () => {
      const { useCase } = makeUseCase(
        { id: TENANT_ID, evolutionInstance: `crivo-${TENANT_ID}` },
        {
          status: jest.fn().mockResolvedValue({
            exists: true,
            state: 'open',
            phone: '5511999998888',
            profileName: 'Clínica Sorriso',
          }),
        },
      );

      const result = await useCase.getStatus(TENANT_ID);

      expect(result).toMatchObject({
        status: 'CONNECTED',
        phone: '5511999998888',
        profileName: 'Clínica Sorriso',
      });
    });

    it('instância sumida do servidor limpa o vínculo em vez de travar', async () => {
      const { useCase, update } = makeUseCase(
        { id: TENANT_ID, evolutionInstance: `crivo-${TENANT_ID}` },
        {
          status: jest.fn().mockResolvedValue({
            exists: false,
            state: null,
            phone: null,
            profileName: null,
          }),
        },
      );

      const result = await useCase.getStatus(TENANT_ID);

      // Apagada por fora ou servidor recriado: sem limpar, a clínica ficaria
      // num estado que a tela não sabe resolver — e o envio falharia igual.
      expect(result.status).toBe('DISCONNECTED');
      expect(update).toHaveBeenCalledWith({
        where: { id: TENANT_ID },
        data: { evolutionInstance: null },
      });
    });
  });

  describe('disconnect', () => {
    it('faz logout e limpa o vínculo', async () => {
      const { useCase, client, update } = makeUseCase({
        id: TENANT_ID,
        evolutionInstance: `crivo-${TENANT_ID}`,
      });

      const result = await useCase.disconnect(TENANT_ID);

      expect(client.logout).toHaveBeenCalledWith(`crivo-${TENANT_ID}`);
      // `logout`, não `remove`: a instância fica de pé para reparear.
      expect(client.remove).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith({
        where: { id: TENANT_ID },
        data: { evolutionInstance: null },
      });
      expect(result.status).toBe('DISCONNECTED');
    });

    it('falha no logout não impede a clínica de desconectar', async () => {
      const { useCase, update } = makeUseCase(
        { id: TENANT_ID, evolutionInstance: `crivo-${TENANT_ID}` },
        { logout: jest.fn().mockRejectedValue(new Error('servidor fora')) },
      );

      // Instância já caída do lado da Evolution não pode deixar a clínica
      // presa numa tela que não desconecta.
      await expect(useCase.disconnect(TENANT_ID)).resolves.toMatchObject({
        status: 'DISCONNECTED',
      });
      expect(update).toHaveBeenCalled();
    });
  });

  it('tenant inexistente é 404, não erro genérico', async () => {
    const { useCase } = makeUseCase(null);

    await expect(useCase.getStatus('sumiu')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
