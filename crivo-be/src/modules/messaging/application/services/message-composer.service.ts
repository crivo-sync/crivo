import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  AI_TEXT_GENERATOR,
  type AiTextGenerator,
} from '../../domain/ai/ai-text-generator';
import {
  MessageTemplateService,
  ReminderTemplateInput,
} from './message-template.service';

export type ComposeReminderInput = ReminderTemplateInput & {
  aiMessagesEnabled: boolean;
};

/**
 * Decide entre texto gerado por IA (DeepSeek) e o template fixo, e é o único
 * lugar que sabe lidar com a falha da IA.
 *
 * Regra inegociável: a chamada de IA nunca atrasa nem derruba o envio. Se
 * `aiMessagesEnabled` for false, se a IA falhar, demorar (timeout no próprio
 * generator) ou devolver um texto que tenha perdido nome/data/link, cai
 * silenciosamente para o template fixo — o paciente sempre recebe a
 * informação certa, com ou sem IA.
 */
@Injectable()
export class MessageComposerService {
  private readonly logger = new Logger(MessageComposerService.name);

  constructor(
    private readonly templates: MessageTemplateService,
    @Inject(AI_TEXT_GENERATOR)
    private readonly aiGenerator: AiTextGenerator,
  ) {}

  async composeReminder(input: ComposeReminderInput): Promise<string> {
    const fixedText = this.templates.appointmentReminder(input);

    if (!input.aiMessagesEnabled) {
      return fixedText;
    }

    const parts = this.templates.reminderParts(input);

    try {
      const aiText = await this.aiGenerator.generateReminderText(parts);

      if (!this.containsRequiredFacts(aiText, parts)) {
        this.logger.warn(
          'Texto da IA omitiu ou alterou um dado obrigatório (nome/data/hora/link) — usando template fixo.',
        );
        return fixedText;
      }

      return aiText;
    } catch (error) {
      this.logger.warn(
        `Geração por IA falhou, usando template fixo: ${(error as Error).message}`,
      );
      return fixedText;
    }
  }

  /**
   * A IA só redige — nunca pode inventar ou corromper fato. Verificamos que
   * paciente, data, horário e o link (inteiro, sem alterar um caractere)
   * seguem presentes no texto final antes de aceitá-lo.
   */
  private containsRequiredFacts(
    text: string,
    parts: {
      patientFirstName: string;
      dateLabel: string;
      timeLabel: string;
      confirmationUrl: string;
    },
  ): boolean {
    return (
      text.includes(parts.patientFirstName) &&
      text.includes(parts.dateLabel) &&
      text.includes(parts.timeLabel) &&
      text.includes(parts.confirmationUrl)
    );
  }
}
