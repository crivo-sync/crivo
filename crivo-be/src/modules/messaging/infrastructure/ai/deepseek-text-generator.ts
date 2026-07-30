import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AiTextGenerator,
  GenerateReminderTextInput,
} from '../../domain/ai/ai-text-generator';

type DeepSeekResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

const SYSTEM_PROMPT = [
  'Você escreve mensagens de WhatsApp para uma clínica de estética/odontologia',
  'confirmar consulta com o paciente. Tom caloroso, natural, breve — como uma',
  'recepcionista atenciosa escreveria, não como um robô de agenda.',
  '',
  'Regras rígidas:',
  '- Use APENAS os dados fornecidos. Nunca invente, corrija ou infira nome,',
  '  data, hora, procedimento ou link — copie-os exatamente como recebidos.',
  '- O link de confirmação deve aparecer inteiro, sem alterar um caractere.',
  '- No máximo 5 linhas curtas. Pode usar 1-2 emojis, sem exagero.',
  '- Não invente promoções, descontos ou informações não fornecidas.',
  '- Responda apenas com o texto da mensagem, sem aspas nem comentários.',
].join('\n');

/**
 * DeepSeek via API compatível com OpenAI Chat Completions.
 *
 * Timeout curto de propósito: esta chamada nunca pode ser o motivo de um
 * lembrete atrasar. Quem chama (`MessageComposer`) trata timeout/erro como
 * sinal para cair no template fixo — nunca espera além da paciência do envio.
 */
@Injectable()
export class DeepSeekTextGenerator implements AiTextGenerator {
  private readonly logger = new Logger(DeepSeekTextGenerator.name);

  constructor(private readonly config: ConfigService) {}

  async generateReminderText(
    input: GenerateReminderTextInput,
  ): Promise<string> {
    const apiKey = this.config.getOrThrow<string>('DEEPSEEK_API_KEY');
    const baseUrl =
      this.config.get<string>('DEEPSEEK_API_URL') ?? 'https://api.deepseek.com';
    const model = this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';
    const timeoutMs = Number(this.config.get('AI_TIMEOUT_MS') ?? 5_000);

    const userPrompt = [
      `Paciente: ${input.patientFirstName}`,
      `Clínica: ${input.clinicName}`,
      `Profissional: ${input.professionalName}`,
      `Procedimento: ${input.procedureName}`,
      `Data: ${input.dateLabel}`,
      `Horário: ${input.timeLabel}`,
      `Link de confirmação (copie exatamente): ${input.confirmationUrl}`,
    ].join('\n');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 300,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          }),
        },
      );

      const payload = (await response.json()) as DeepSeekResponse;

      if (!response.ok) {
        throw new Error(
          `DeepSeek respondeu ${response.status}: ${
            payload.error?.message ?? 'erro desconhecido'
          }`,
        );
      }

      const text = payload.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new Error('DeepSeek retornou resposta vazia.');
      }

      return text;
    } finally {
      clearTimeout(timeout);
    }
  }
}
