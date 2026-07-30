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

  appointmentReminder(input: ReminderTemplateInput): string {
    const date = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
    }).format(input.startsAt);

    const time = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    }).format(input.startsAt);

    const firstName = input.patientName.split(' ')[0];

    return [
      `Olá, ${firstName}! 👋`,
      '',
      `Lembrete da sua consulta na *${input.clinicName}*:`,
      '',
      `📅 ${date} às ${time}`,
      `💠 ${input.procedureName}`,
      `👤 ${input.professionalName}`,
      '',
      'Você confirma a presença? Toque no link:',
      this.confirmationUrl(input.confirmationToken),
    ].join('\n');
  }

  confirmationReceipt(clinicName: string): string {
    return `Presença confirmada! ✅ Te esperamos na ${clinicName}.`;
  }
}
