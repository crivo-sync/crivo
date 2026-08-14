import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MessagingProvider } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  EvolutionInstanceClient,
  type EvolutionConnectionState,
} from '../../infrastructure/providers/evolution-instance.client';

/**
 * O que a clínica vê na tela de conexão do WhatsApp.
 *
 * Deliberadamente **não** expõe o nome da instância: é detalhe do servidor
 * Evolution, e conhecê-lo não ajuda a clínica em nada — mas ajudaria quem
 * quisesse tentar se conectar à instância de outra.
 */
export type WhatsAppConnection = {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  /** Data URI do QR, presente só enquanto o pareamento está pendente. */
  qrCode: string | null;
  /** Número conectado, para a clínica conferir que pareou o telefone certo. */
  phone: string | null;
  profileName: string | null;
};

@Injectable()
export class ManageWhatsAppConnectionUseCase {
  private readonly logger = new Logger(ManageWhatsAppConnectionUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolution: EvolutionInstanceClient,
  ) {}

  /**
   * Lê o estado atual, sem criar nada.
   *
   * Chamado em laço pela tela enquanto o QR está na frente da clínica: é a
   * forma de descobrir que ela apontou a câmera e o pareamento concluiu.
   */
  async getStatus(tenantId: string): Promise<WhatsAppConnection> {
    const tenant = await this.findTenant(tenantId);

    if (!tenant.evolutionInstance) {
      return disconnected();
    }

    const status = await this.evolution.status(tenant.evolutionInstance);

    if (!status.exists) {
      /**
       * O banco aponta para uma instância que não existe mais no servidor
       * Evolution (apagada por fora, ou servidor recriado). Limpar o vínculo
       * evita que a clínica fique presa num estado que a tela não sabe
       * resolver — e o envio, que usa o mesmo campo, falharia de qualquer
       * forma.
       */
      await this.clearInstance(tenantId);

      return disconnected();
    }

    return {
      status: toStatus(status.state),
      qrCode: null,
      phone: status.phone,
      profileName: status.profileName,
    };
  }

  /**
   * Começa (ou recomeça) o pareamento e devolve o QR para a clínica ler.
   *
   * Idempotente de propósito: se a instância já existe, pede um QR novo em
   * vez de recriar. O QR da Evolution expira em segundos, então "gerar de
   * novo" é o caminho normal, não a exceção.
   */
  async connect(tenantId: string): Promise<WhatsAppConnection> {
    const tenant = await this.findTenant(tenantId);

    /**
     * **O nome da instância é derivado do tenant, nunca informado.**
     *
     * Até aqui a clínica digitava esse nome nas Configurações — o que, além
     * de ser uma pergunta que ninguém sabe responder, permitia digitar o
     * nome da instância de outra clínica e passar a enviar pelo WhatsApp
     * dela. Derivar do `id` fecha isso: não há campo onde escrever o nome
     * alheio.
     */
    const instanceName = tenant.evolutionInstance ?? instanceNameFor(tenantId);

    const current = await this.evolution.status(instanceName);

    // Já conectado: devolve o estado em vez de derrubar a conexão para
    // mostrar um QR que a clínica não precisa ler.
    if (current.exists && current.state === 'open') {
      await this.saveInstance(tenantId, instanceName);

      return {
        status: 'CONNECTED',
        qrCode: null,
        phone: current.phone,
        profileName: current.profileName,
      };
    }

    const { qrCode } = current.exists
      ? await this.evolution.connect(instanceName)
      : await this.evolution.create(instanceName);

    /**
     * Grava o vínculo **e** marca o provider como Evolution: a clínica que
     * acabou de parear um número espera que as mensagens saiam por ele. Sem
     * isso, o envio continuaria caindo no padrão do servidor e o pareamento
     * não teria efeito visível nenhum.
     */
    await this.saveInstance(tenantId, instanceName);

    this.logger.log(`Pareamento iniciado para o tenant ${tenantId}.`);

    return {
      status: 'CONNECTING',
      qrCode,
      phone: null,
      profileName: null,
    };
  }

  /**
   * Desconecta o número da clínica.
   *
   * Faz `logout` (derruba a sessão do WhatsApp) e **não** `delete`: a
   * instância continua existindo para um novo pareamento, e o histórico de
   * mensagens no nosso banco segue intacto de qualquer forma.
   */
  async disconnect(tenantId: string): Promise<WhatsAppConnection> {
    const tenant = await this.findTenant(tenantId);

    if (tenant.evolutionInstance) {
      try {
        await this.evolution.logout(tenant.evolutionInstance);
      } catch (error) {
        /**
         * Instância já caída no servidor não deve travar a clínica na tela.
         * O que importa para nós é o vínculo no banco, limpo logo abaixo.
         */
        this.logger.warn(
          `Logout da instância ${tenant.evolutionInstance} falhou: ${String(error)}`,
        );
      }
    }

    await this.clearInstance(tenantId);

    return disconnected();
  }

  private async findTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, evolutionInstance: true },
    });

    if (!tenant) {
      throw new NotFoundException('Clínica não encontrada.');
    }

    return tenant;
  }

  private async saveInstance(tenantId: string, instanceName: string) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        evolutionInstance: instanceName,
        messagingProvider: MessagingProvider.EVOLUTION,
      },
    });
  }

  private async clearInstance(tenantId: string) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      // `messagingProvider` fica como está: desconectar o número não é
      // dizer "volte a usar outro caminho de envio".
      data: { evolutionInstance: null },
    });
  }
}

/**
 * Nome da instância no servidor Evolution.
 *
 * Prefixo + id do tenant: previsível para depurar, único por construção, e
 * dentro do formato aceito (letras, números, hífen).
 */
function instanceNameFor(tenantId: string): string {
  return `crivo-${tenantId}`;
}

function disconnected(): WhatsAppConnection {
  return {
    status: 'DISCONNECTED',
    qrCode: null,
    phone: null,
    profileName: null,
  };
}

function toStatus(
  state: EvolutionConnectionState | null,
): WhatsAppConnection['status'] {
  if (state === 'open') return 'CONNECTED';
  if (state === 'connecting') return 'CONNECTING';

  return 'DISCONNECTED';
}
