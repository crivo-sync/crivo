import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageType } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { renderTemplate, type TemplateValues } from './template-renderer';

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
  private readonly logger = new Logger(MessageTemplateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Texto da clínica quando existe; o fixo do código quando não.
   *
   * O fallback não é detalhe: clínica que nunca personalizou não tem linha
   * nenhuma na tabela, e template desligado (`isActive: false`) precisa
   * voltar ao padrão sem perder o que foi escrito.
   */
  private async customBody(
    tenantId: string,
    type: MessageType,
  ): Promise<string | null> {
    try {
      const template = await this.prisma.messageTemplate.findUnique({
        where: { tenantId_type: { tenantId, type } },
        select: { body: true, isActive: true },
      });

      return template?.isActive ? template.body : null;
    } catch (error) {
      // Personalização não pode derrubar o envio: falha aqui cai no texto
      // padrão, que sempre funciona.
      this.logger.warn(
        `Não foi possível ler o template de ${type}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }. Usando o texto padrão.`,
      );
      return null;
    }
  }

  /**
   * O texto padrão **com os marcadores à mostra**, para a tela usar como
   * ponto de partida.
   *
   * Escrito à mão, e não derivado de `appointmentReminder()`: aquele método
   * já devolve o texto com os valores substituídos, e voltar de "12/08" para
   * `{{data}}` exigiria adivinhar qual pedaço era marcador. Duplicar o texto
   * aqui é o preço de a clínica começar a editar de algo que funciona.
   */
  defaultBodyFor(type: MessageType): string {
    if (type === MessageType.APPOINTMENT_BOOKED) {
      return [
        'Olá, {{paciente}}! 👋',
        '',
        'Sua consulta na *{{clinica}}* foi marcada:',
        '',
        '📅 {{data}} às {{hora}}',
        '💠 {{procedimento}}',
        '👤 {{profissional}}',
        '',
        'Já pode confirmar a presença por aqui:',
        '{{link}}',
        '',
        'Enviaremos um lembrete um dia antes. 😉',
      ].join('\n');
    }

    return [
      'Olá, {{paciente}}! 👋',
      '',
      'Lembrete da sua consulta na *{{clinica}}*:',
      '',
      '📅 {{data}} às {{hora}}',
      '💠 {{procedimento}}',
      '👤 {{profissional}}',
      '',
      'Você confirma a presença? Toque no link:',
      '{{link}}',
    ].join('\n');
  }

  /** Valores dos marcadores para um lembrete/aviso. */
  private valuesFor(input: ReminderTemplateInput): TemplateValues {
    const parts = this.reminderParts(input);

    return {
      paciente: parts.patientFirstName,
      clinica: parts.clinicName,
      profissional: parts.professionalName,
      procedimento: parts.procedureName,
      data: parts.dateLabel,
      hora: parts.timeLabel,
      link: parts.confirmationUrl,
    };
  }

  /**
   * Lembrete D-1, já com o texto da clínica se ela tiver personalizado.
   *
   * Assíncrono porque consulta o banco — as versões síncronas continuam
   * existindo como o texto padrão e são o que a IA recebe para reescrever.
   */
  async renderReminder(
    tenantId: string,
    input: ReminderTemplateInput,
  ): Promise<string> {
    const custom = await this.customBody(
      tenantId,
      MessageType.APPOINTMENT_REMINDER,
    );

    return custom
      ? renderTemplate(custom, this.valuesFor(input))
      : this.appointmentReminder(input);
  }

  async renderBooked(
    tenantId: string,
    input: ReminderTemplateInput,
    options: { rescheduled?: boolean } = {},
  ): Promise<string> {
    const custom = await this.customBody(
      tenantId,
      MessageType.APPOINTMENT_BOOKED,
    );

    return custom
      ? renderTemplate(custom, this.valuesFor(input))
      : this.appointmentBooked(input, options);
  }

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

  /**
   * Enviada assim que a consulta é marcada. Diferente do lembrete, ela
   * *informa* um horário novo em vez de relembrar um já conhecido — por isso
   * o texto diz "foi marcada" e não "lembrete da sua consulta".
   */
  appointmentBooked(
    input: ReminderTemplateInput,
    { rescheduled = false }: { rescheduled?: boolean } = {},
  ): string {
    const { patientFirstName, dateLabel, timeLabel, confirmationUrl } =
      this.reminderParts(input);

    return [
      `Olá, ${patientFirstName}! 👋`,
      '',
      rescheduled
        ? `Sua consulta na *${input.clinicName}* foi *remarcada*:`
        : `Sua consulta na *${input.clinicName}* foi marcada:`,
      '',
      `📅 ${dateLabel} às ${timeLabel}`,
      `💠 ${input.procedureName}`,
      `👤 ${input.professionalName}`,
      '',
      'Já pode confirmar a presença por aqui:',
      confirmationUrl,
      '',
      'Enviaremos um lembrete um dia antes. 😉',
    ].join('\n');
  }

  confirmationReceipt(clinicName: string): string {
    return `Presença confirmada! ✅ Te esperamos na ${clinicName}.`;
  }

  /**
   * Aviso de vaga para quem está na lista de espera.
   *
   * **Não confirma nada nem reserva o horário**: o texto pede uma resposta,
   * e quem agenda é a recepção. A mesma vaga costuma ser oferecida a mais de
   * uma pessoa — prometer o horário a todas geraria conflito e uma
   * conversa constrangedora com quem chegou em segundo.
   *
   * Sem link de confirmação de propósito: aquele token pertence a um
   * agendamento que ainda não existe.
   */
  waitlistOffer(input: {
    patientName: string;
    clinicName: string;
    professionalName: string;
    procedureName: string;
    startsAt: Date;
  }): string {
    const dateLabel = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
    }).format(input.startsAt);

    const timeLabel = new Intl.DateTimeFormat('pt-BR', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    }).format(input.startsAt);

    return [
      `Olá, ${input.patientName.split(' ')[0]}! 👋`,
      '',
      `Abriu uma vaga na *${input.clinicName}*:`,
      '',
      `📅 ${dateLabel} às ${timeLabel}`,
      `💠 ${input.procedureName}`,
      `👤 ${input.professionalName}`,
      '',
      'Tem interesse? Responda esta mensagem que confirmamos com você.',
      '',
      '_A vaga é por ordem de resposta._',
    ].join('\n');
  }
}
