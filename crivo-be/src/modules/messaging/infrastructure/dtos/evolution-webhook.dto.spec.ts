import {
  extractInboundMessage,
  type EvolutionWebhookDto,
} from './evolution-webhook.dto';

/** Payload mínimo de uma mensagem de texto recebida. */
function payload(
  overrides: Partial<EvolutionWebhookDto['data']> = {},
  event = 'MESSAGES_UPSERT',
): EvolutionWebhookDto {
  return {
    event,
    instance: 'crivo-dev',
    data: {
      key: {
        remoteJid: '5511987654321@s.whatsapp.net',
        fromMe: false,
        id: 'ABC123',
      },
      pushName: 'Ana Souza',
      message: { conversation: 'Confirmo minha consulta' },
      messageType: 'conversation',
      messageTimestamp: 1_770_000_000,
      ...overrides,
    },
  };
}

describe('extractInboundMessage', () => {
  it('extrai telefone, texto e id de uma mensagem de texto', () => {
    const result = extractInboundMessage(payload());

    expect(result).toEqual({
      fromPhone: '5511987654321',
      body: 'Confirmo minha consulta',
      providerMessageId: 'ABC123',
      sentAt: new Date(1_770_000_000 * 1000),
    });
  });

  it('lê o texto de extendedTextMessage quando não há conversation', () => {
    const result = extractInboundMessage(
      payload({ message: { extendedTextMessage: { text: 'Pode remarcar?' } } }),
    );

    expect(result?.body).toBe('Pode remarcar?');
  });

  it('converte o timestamp de segundos para milissegundos', () => {
    // 1770000000s = 2026-02-02T02:40:00Z. Tratar como ms cairia em 1970.
    const result = extractInboundMessage(payload());

    expect(result?.sentAt.getUTCFullYear()).toBe(2026);
  });

  describe('ignora eventos que não são mensagem do paciente', () => {
    it('descarta evento de outro tipo', () => {
      expect(
        extractInboundMessage(payload({}, 'CONNECTION_UPDATE')),
      ).toBeNull();
    });

    it('descarta mensagem que nós mesmos enviamos (fromMe)', () => {
      // O lembrete que sai pela Evolution volta pelo webhook; gravar isso
      // duplicaria a saída como se fosse resposta do paciente.
      const result = extractInboundMessage(
        payload({
          key: {
            remoteJid: '5511987654321@s.whatsapp.net',
            fromMe: true,
            id: 'X',
          },
        }),
      );

      expect(result).toBeNull();
    });

    it('descarta mensagem de grupo', () => {
      const result = extractInboundMessage(
        payload({
          key: { remoteJid: '120363@g.us', fromMe: false, id: 'X' },
        }),
      );

      expect(result).toBeNull();
    });

    it('descarta mídia sem texto (áudio, imagem sem legenda)', () => {
      const result = extractInboundMessage(
        payload({ message: {}, messageType: 'audioMessage' }),
      );

      expect(result).toBeNull();
    });

    it('descarta texto só com espaço', () => {
      expect(
        extractInboundMessage(payload({ message: { conversation: '   ' } })),
      ).toBeNull();
    });

    it('não quebra com payload vazio', () => {
      expect(extractInboundMessage({})).toBeNull();
      expect(extractInboundMessage({ event: 'MESSAGES_UPSERT' })).toBeNull();
    });
  });

  it('aceita o evento em minúsculas', () => {
    // A doc mostra MESSAGES_UPSERT, mas a Evolution já emitiu
    // "messages.upsert" em versões diferentes — normalizar evita perder
    // mensagem por causa de caixa.
    expect(extractInboundMessage(payload({}, 'messages_upsert'))).not.toBeNull();
  });

  it('remove espaço em volta do texto', () => {
    const result = extractInboundMessage(
      payload({ message: { conversation: '  SIM  ' } }),
    );

    expect(result?.body).toBe('SIM');
  });
});
