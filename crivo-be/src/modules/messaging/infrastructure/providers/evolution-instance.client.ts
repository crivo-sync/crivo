import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Conversa com a Evolution API sobre **a instância** (o número da clínica),
 * não sobre mensagens.
 *
 * Fica separado do `EvolutionMessageProvider` de propósito: aquele implementa
 * o contrato `MessageProvider`, que existe para o resto do sistema não saber
 * qual caminho o WhatsApp usa. Parear por QR code **é** específico da
 * Evolution — a Meta oficial não tem esse conceito (lá o número é
 * homologado no painel da Meta). Enfiar isto no contrato obrigaria o provider
 * da Meta a implementar métodos que não fazem sentido para ele.
 *
 * Verificado contra a Evolution API 2.3.7.
 */

/** Como a Evolution nomeia os estados de conexão. */
export type EvolutionConnectionState = 'open' | 'connecting' | 'close';

export type EvolutionInstanceStatus = {
  exists: boolean;
  state: EvolutionConnectionState | null;
  /** Número conectado, quando há um (`5511999998888@s.whatsapp.net` → dígitos). */
  phone: string | null;
  profileName: string | null;
};

type FetchInstancesItem = {
  name?: string;
  connectionStatus?: string;
  ownerJid?: string;
  profileName?: string;
};

type ConnectResponse = {
  /** Data URI do QR (`data:image/png;base64,...`). */
  base64?: string;
  /** O mesmo QR em texto, quando a instância acabou de ser criada. */
  code?: string;
  instance?: { state?: string };
};

type CreateInstanceResponse = {
  qrcode?: { base64?: string; code?: string };
};

@Injectable()
export class EvolutionInstanceClient {
  private readonly logger = new Logger(EvolutionInstanceClient.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Cria a instância e já devolve o primeiro QR.
   *
   * `qrcode: true` faz a Evolution gerar o código na própria criação — sem
   * isso seria preciso criar e depois chamar `/instance/connect`, com uma
   * janela em que a instância existe mas não tem QR para mostrar.
   */
  async create(instanceName: string): Promise<{ qrCode: string | null }> {
    const payload = await this.request<CreateInstanceResponse>(
      'POST',
      '/instance/create',
      {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      },
    );

    return { qrCode: payload.qrcode?.base64 ?? null };
  }

  /**
   * Pede um QR novo para uma instância que já existe.
   *
   * O QR da Evolution expira em segundos e é rotacionado — por isso a tela
   * reconsulta em vez de guardar a imagem.
   */
  async connect(instanceName: string): Promise<{ qrCode: string | null }> {
    const payload = await this.request<ConnectResponse>(
      'GET',
      `/instance/connect/${encodeURIComponent(instanceName)}`,
    );

    return { qrCode: payload.base64 ?? null };
  }

  /**
   * Estado atual da instância.
   *
   * Usa `fetchInstances` (e não `connectionState`) porque este devolve também
   * o número e o nome do perfil conectado — é o que permite a tela dizer
   * "conectado como (11) 95286-1726" em vez de só "conectado", e é assim que
   * a clínica confere que pareou o telefone certo.
   */
  async status(instanceName: string): Promise<EvolutionInstanceStatus> {
    // Instância inexistente responde **404**, não lista vazia (verificado na
    // 2.3.7). Sem este tratamento, "ainda não pareei" viraria erro 500 na
    // tela — que é justamente o estado inicial de toda clínica nova.
    const list = await this.request<FetchInstancesItem[]>(
      'GET',
      `/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
      undefined,
      { notFoundAsNull: true },
    );

    if (list === null) {
      return { exists: false, state: null, phone: null, profileName: null };
    }

    // O filtro por nome é do lado do servidor, mas a Evolution devolve a
    // lista inteira quando não reconhece o parâmetro — conferir aqui evita
    // ler o estado da instância de outra clínica.
    const found = Array.isArray(list)
      ? list.find((item) => item.name === instanceName)
      : undefined;

    if (!found) {
      return { exists: false, state: null, phone: null, profileName: null };
    }

    return {
      exists: true,
      state: toConnectionState(found.connectionStatus),
      phone: toPhone(found.ownerJid),
      profileName: found.profileName ?? null,
    };
  }

  /** Desconecta o WhatsApp, mas mantém a instância para reparear. */
  async logout(instanceName: string): Promise<void> {
    await this.request(
      'DELETE',
      `/instance/logout/${encodeURIComponent(instanceName)}`,
    );
  }

  /**
   * Remove a instância inteira do servidor Evolution.
   *
   * ⚠️ **A remoção é assíncrona**: a Evolution responde `SUCCESS` na hora,
   * mas a instância ainda aparece em `fetchInstances` por alguns segundos
   * (verificado na 2.3.7). Quem chamar não deve reler o status logo em
   * seguida esperando que já tenha sumido.
   */
  async remove(instanceName: string): Promise<void> {
    await this.request(
      'DELETE',
      `/instance/delete/${encodeURIComponent(instanceName)}`,
    );
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
    options?: { notFoundAsNull?: boolean },
  ): Promise<T> {
    const baseUrl = this.config
      .getOrThrow<string>('EVOLUTION_API_URL')
      .replace(/\/$/, '');
    const apiKey = this.config.getOrThrow<string>('EVOLUTION_API_KEY');

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 404 && options?.notFoundAsNull) {
      return null as T;
    }

    if (!response.ok) {
      const detail = await response.text();

      this.logger.warn(
        `Evolution ${method} ${path} respondeu ${response.status}: ${detail.slice(0, 200)}`,
      );

      throw new Error(
        `Evolution API respondeu ${response.status}: ${detail.slice(0, 200)}`,
      );
    }

    return (await response.json()) as T;
  }
}

function toConnectionState(
  status: string | undefined,
): EvolutionConnectionState | null {
  if (status === 'open' || status === 'connecting' || status === 'close') {
    return status;
  }

  return null;
}

/** `5511952861726@s.whatsapp.net` → `5511952861726`. */
function toPhone(ownerJid: string | undefined): string | null {
  if (!ownerJid) return null;

  const digits = ownerJid.split('@')[0]?.replace(/\D/g, '');

  return digits || null;
}
