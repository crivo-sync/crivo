import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageType, WaitlistStatus } from '@prisma/client';
import { Queue } from 'bullmq';

import { MessageTemplateService } from 'src/modules/messaging/application/services/message-template.service';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from 'src/modules/messaging/domain/repository/message.repository';
import {
  MESSAGING_QUEUE,
  SEND_JOB_OPTIONS,
  SendMessageJob,
} from 'src/modules/messaging/infrastructure/queue/messaging.queue';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { rankCandidates, type OpenSlot } from '../domain/slot-matching';

export type AddToWaitlistInput = {
  tenantId: string;
  patientId: string;
  procedureId: string;
  professionalId?: string;
  preferredFrom?: Date;
  preferredTo?: Date;
  notes?: string;
};

const ENTRY_RELATIONS = {
  patient: { select: { id: true, name: true, phone: true } },
  professional: { select: { id: true, name: true } },
  procedure: { select: { id: true, name: true, durationMinutes: true } },
};

@Injectable()
export class ManageWaitlistUseCase {
  private readonly logger = new Logger(ManageWaitlistUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @InjectQueue(MESSAGING_QUEUE)
    private readonly queue: Queue<SendMessageJob>,
    private readonly templates: MessageTemplateService,
  ) {}

  async add(input: AddToWaitlistInput) {
    // O paciente precisa ser da clínica: sem isto, um id de outro tenant
    // entraria na fila e a recepção veria um nome que não reconhece.
    const patient = await this.prisma.patient.findFirst({
      where: { id: input.patientId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (
      input.preferredFrom &&
      input.preferredTo &&
      input.preferredTo < input.preferredFrom
    ) {
      throw new BadRequestException(
        'O fim da janela precisa ser depois do início.',
      );
    }

    // Mesma pessoa esperando o mesmo procedimento duas vezes é engano de
    // digitação, não intenção — e duplicaria a oferta quando a vaga abrisse.
    const existing = await this.prisma.waitlistEntry.findFirst({
      where: {
        tenantId: input.tenantId,
        patientId: input.patientId,
        procedureId: input.procedureId,
        status: { in: [WaitlistStatus.WAITING, WaitlistStatus.OFFERED] },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Este paciente já está na lista de espera para este procedimento.',
      );
    }

    return this.prisma.waitlistEntry.create({
      data: {
        tenantId: input.tenantId,
        patientId: input.patientId,
        procedureId: input.procedureId,
        professionalId: input.professionalId,
        preferredFrom: input.preferredFrom,
        preferredTo: input.preferredTo,
        notes: input.notes,
      },
      include: ENTRY_RELATIONS,
    });
  }

  /** Fila da clínica. Por padrão só quem ainda espera. */
  async list(
    tenantId: string,
    options: { status?: WaitlistStatus; includeResolved?: boolean } = {},
  ) {
    const where = options.status
      ? { tenantId, status: options.status }
      : options.includeResolved
        ? { tenantId }
        : {
            tenantId,
            status: {
              in: [WaitlistStatus.WAITING, WaitlistStatus.OFFERED],
            },
          };

    return this.prisma.waitlistEntry.findMany({
      where,
      include: ENTRY_RELATIONS,
      // Ordem de chegada: é a mesma ordem em que a vaga será oferecida.
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string, tenantId: string) {
    const { count } = await this.prisma.waitlistEntry.updateMany({
      where: { id, tenantId },
      data: { status: WaitlistStatus.CANCELLED },
    });

    if (count === 0) {
      throw new NotFoundException('Item da lista de espera não encontrado.');
    }

    // Cancelado em vez de apagado: saber quantas pessoas desistiram de
    // esperar é o dado que diz se a agenda está apertada demais.
    return { cancelled: true };
  }

  /**
   * Quem, da fila, serve para uma vaga que abriu.
   *
   * Só **sugere**: a oferta em si é um passo à parte (`markOffered`), que a
   * recepção dispara escolhendo quem avisar. Mandar automaticamente para o
   * primeiro da fila parece eficiente, mas remarcar tem contexto que o
   * sistema não tem ("essa paciente pediu para não ligar de manhã"), e
   * oferta errada gasta conversa paga.
   */
  async candidatesForSlot(tenantId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: {
        professionalId: true,
        procedureId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const slot: OpenSlot = appointment;

    const waiting = await this.prisma.waitlistEntry.findMany({
      where: { tenantId, status: WaitlistStatus.WAITING },
      include: ENTRY_RELATIONS,
    });

    const ranked = rankCandidates(
      waiting.map((entry) => ({
        id: entry.id,
        procedureId: entry.procedureId,
        professionalId: entry.professionalId,
        preferredFrom: entry.preferredFrom,
        preferredTo: entry.preferredTo,
        createdAt: entry.createdAt,
      })),
      slot,
    );

    // Devolve a entidade completa na ordem da fila — o `rankCandidates`
    // trabalha só com o necessário para decidir.
    const byId = new Map(waiting.map((entry) => [entry.id, entry]));

    return {
      slot,
      candidates: ranked
        .map((candidate) => byId.get(candidate.id))
        .filter((entry): entry is NonNullable<typeof entry> => !!entry),
    };
  }

  /**
   * Registra a oferta e, quando há uma vaga concreta, avisa o paciente pelo
   * WhatsApp.
   *
   * `appointmentId` opcional porque a recepção também usa isto depois de
   * ligar por conta própria — nesse caso só marca, sem mandar mensagem.
   */
  async markOffered(
    id: string,
    tenantId: string,
    appointmentId?: string,
  ): Promise<{ offered: boolean; notified: boolean }> {
    const { count } = await this.prisma.waitlistEntry.updateMany({
      where: { id, tenantId, status: WaitlistStatus.WAITING },
      data: { status: WaitlistStatus.OFFERED, offeredAt: new Date() },
    });

    if (count === 0) {
      throw new NotFoundException(
        'Item não encontrado ou já não está aguardando.',
      );
    }

    this.logger.log(`Vaga oferecida para o item ${id} da lista de espera.`);

    if (!appointmentId) {
      return { offered: true, notified: false };
    }

    // O envio não pode desfazer a marcação: se o WhatsApp falhar, a vaga
    // continua oferecida e a recepção liga. Voltar o status para `WAITING`
    // faria a mesma pessoa ser sugerida de novo na consulta seguinte.
    try {
      await this.notifyOffer(id, tenantId, appointmentId);
      return { offered: true, notified: true };
    } catch (error) {
      this.logger.warn(
        `Oferta registrada, mas o aviso não foi enviado (${id}): ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
      return { offered: true, notified: false };
    }
  }

  private async notifyOffer(
    entryId: string,
    tenantId: string,
    appointmentId: string,
  ): Promise<void> {
    const [entry, appointment] = await Promise.all([
      this.prisma.waitlistEntry.findFirst({
        where: { id: entryId, tenantId },
        include: {
          patient: { select: { name: true, phone: true } },
          tenant: { select: { name: true } },
        },
      }),
      this.prisma.appointment.findFirst({
        where: { id: appointmentId, tenantId },
        include: {
          professional: { select: { name: true } },
          procedure: { select: { name: true } },
        },
      }),
    ]);

    if (!entry || !appointment) return;

    const body = this.templates.waitlistOffer({
      patientName: entry.patient.name,
      clinicName: entry.tenant.name,
      professionalName: appointment.professional.name,
      procedureName: appointment.procedure.name,
      startsAt: appointment.startsAt,
    });

    const message = await this.messageRepository.create({
      tenantId,
      // Sem `appointmentId`: aquele agendamento foi cancelado, e vinculá-lo
      // faria a mensagem aparecer no histórico de um atendimento que não
      // vai acontecer.
      type: MessageType.WAITLIST_OFFER,
      toPhone: entry.patient.phone,
      body,
      scheduledFor: new Date(),
    });

    await this.queue.add('send', { messageId: message.id }, SEND_JOB_OPTIONS);
  }
}
