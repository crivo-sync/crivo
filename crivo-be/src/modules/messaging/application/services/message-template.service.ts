import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ReminderTemplateInput = {
  patientName: string;
  clinicName: string;
  professionalName: string;
  procedureName: string;
  startsAt: Date;
  confirmationToken: string;
};

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Monta o texto das mensagens. Fica isolado porque cada clínica vai poder
 * personalizar o template — e porque na Meta oficial o texto livre só vale
 * dentro da janela de 24h; fora dela vira template aprovado.
 */
@Injectable()
export class MessageTemplateService {
  constructor(private readonly config: ConfigService) {}

  private confirmationUrl(token: string): string {
    const baseUrl =
      this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3333';

    return `${baseUrl.replace(/\/$/, '')}/c/${token}`;
  }

  /**
   * Campos já formatados do lembrete, separados do texto final. Usado tanto
   * para montar o prompt da IA quanto para validar depois que ela não
   * corrompeu nenhum dado — por isso a formatação de data/hora/link vive
   * neste único lugar.
   */
  reminderParts(input: ReminderTemplateInput) {
    return {
      patientFirstName: input.patientName.split(' ')[0],
      clinicName: input.clinicName,
      professionalName: input.professionalName,
      procedureName: input.procedureName,
      dateLabel: new Intl.DateTimeFormat('pt-BR', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
      }).format(input.startsAt),
      timeLabel: new Intl.DateTimeFormat('pt-BR', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
      }).format(input.startsAt),
      confirmationUrl: this.confirmationUrl(input.confirmationToken),
    };
  }

  appointmentReminder(input: ReminderTemplateInput): string {
    const { patientFirstName, dateLabel, timeLabel, confirmationUrl } =
      this.reminderParts(input);

    return [
      `Olá, ${patientFirstName}! 👋`,
      '',
      `Lembrete da sua consulta na *${input.clinicName}*:`,
      '',
      `📅 ${dateLabel} às ${timeLabel}`,
      `💠 ${input.procedureName}`,
      `👤 ${input.professionalName}`,
      '',
      'Você confirma a presença? Toque no link:',
      confirmationUrl,
    ].join('\n');
  }

  confirmationReceipt(clinicName: string): string {
    return `Presença confirmada! ✅ Te esperamos na ${clinicName}.`;
  }
}
