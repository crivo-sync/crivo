export type GenerateReminderTextInput = {
  patientFirstName: string;
  clinicName: string;
  professionalName: string;
  procedureName: string;
  dateLabel: string;
  timeLabel: string;
  confirmationUrl: string;
};

export const AI_TEXT_GENERATOR = 'AiTextGenerator';

/**
 * Gera o texto da mensagem via IA. Implementação única hoje (DeepSeek), mas
 * fica atrás de interface — trocar de modelo/provider de IA não deve tocar
 * o restante do módulo de mensageria.
 */
export type AiTextGenerator = {
  generateReminderText(input: GenerateReminderTextInput): Promise<string>;
};
