import { AppointmentOrigin, WaitlistStatus } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { ScheduleAppointmentReminderUseCase } from 'src/modules/messaging/application/use-cases/schedule-appointment-reminder.use-case';
import {
  isOverProfessionalLimit,
  OVER_LIMIT_BOOKING_MESSAGE,
  OVER_LIMIT_PUBLIC_BOOKING_MESSAGE,
} from 'src/modules/professionals/application/professional-limit';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';
import { BusinessHoursService } from '../services/business-hours.service';
import { ProfessionalAvailabilityService } from '../services/professional-availability.service';

export type CreateAppointmentInput = {
  tenantId: string;
  patientId: string;
  professionalId: string;
  procedureId: string;
  startsAt: Date;
  notes?: string;
  /** `ONLINE` quando veio da página pública. Default `STAFF`. */
  origin?: AppointmentOrigin;
  /**
   * Fecha o ciclo da lista de espera: este agendamento nasce da vaga que a
   * `WaitlistEntry` esperava. Opcional — a maioria dos agendamentos não vem
   * de fila nenhuma.
   *
   * Sem isto, `markOffered` (avisar o paciente da vaga) e o novo agendamento
   * criado depois eram dois atos desconectados: a `WaitlistEntry` ficava
   * presa em `OFFERED` para sempre, mesmo quando a pessoa de fato remarcou
   * — o próprio ROADMAP já registrava essa lacuna.
   */
  waitlistEntryId?: string;
};

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly scheduleReminder: ScheduleAppointmentReminderUseCase,
    private readonly businessHours: BusinessHoursService,
    private readonly professionalAvailability: ProfessionalAvailabilityService,
  ) {}

  async execute(input: CreateAppointmentInput) {
    if (input.startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Não é possível agendar em um horário no passado.',
      );
    }

    /**
     * Vale para o painel **e** para a página pública (as duas passam por
     * aqui): sem isso, o limite do plano só existia no cadastro e uma
     * clínica acima do teto seguia marcando normalmente com todo mundo.
     * Bloqueia só o agendamento **novo** — a agenda já marcada continua de
     * pé, porque cancelar consulta de paciente por causa de plano seria
     * punir quem não tem nada com isso.
     *
     * A mensagem muda conforme quem está do outro lado: `ONLINE` é o
     * paciente na página pública, que não tem painel nem assinatura e não
     * pode resolver nada — contar a ele que a clínica está acima do plano
     * vaza pendência comercial para um terceiro.
     */
    if (await isOverProfessionalLimit(this.prisma, input.tenantId)) {
      throw new ForbiddenException(
        input.origin === AppointmentOrigin.ONLINE
          ? OVER_LIMIT_PUBLIC_BOOKING_MESSAGE
          : OVER_LIMIT_BOOKING_MESSAGE,
      );
    }

    // Buscar os três com filtro de tenant garante que a recepção não consiga
    // agendar usando o paciente ou o profissional de outra clínica.
    const [patient, professional, procedure, waitlistEntry] = await Promise.all(
      [
        this.prisma.patient.findFirst({
          where: {
            id: input.patientId,
            tenantId: input.tenantId,
            deletedAt: null,
          },
          select: { id: true },
        }),
        this.prisma.professional.findFirst({
          where: {
            id: input.professionalId,
            tenantId: input.tenantId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true, procedures: { select: { id: true } } },
        }),
        this.prisma.procedure.findFirst({
          where: {
            id: input.procedureId,
            tenantId: input.tenantId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true, durationMinutes: true, priceInCents: true },
        }),
        input.waitlistEntryId
          ? this.prisma.waitlistEntry.findFirst({
              where: { id: input.waitlistEntryId, tenantId: input.tenantId },
              select: { id: true, patientId: true, status: true },
            })
          : Promise.resolve(null),
      ],
    );

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado ou inativo.');
    }

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado ou inativo.');
    }

    if (input.waitlistEntryId) {
      if (!waitlistEntry) {
        throw new NotFoundException('Item da lista de espera não encontrado.');
      }

      // Mesmo paciente da entrada: sem isto, fechar a fila de uma pessoa
      // agendando outra seria um clique errado silencioso — a fila mostraria
      // "Agendado" para quem continua sem consulta marcada.
      if (waitlistEntry.patientId !== input.patientId) {
        throw new BadRequestException(
          'Este item da lista de espera é de outro paciente.',
        );
      }

      // `WAITING` cobre a recepção que agenda direto, sem passar por
      // "Avisar" antes (o botão "Agendar" abre o mesmo formulário nos dois
      // estados). Só `SCHEDULED`/`CANCELLED` recusam — a fila já foi
      // resolvida ou desistiu, reabri-la aqui seria o sistema inventando um
      // estado que a recepção não pediu.
      if (
        waitlistEntry.status !== WaitlistStatus.WAITING &&
        waitlistEntry.status !== WaitlistStatus.OFFERED
      ) {
        throw new BadRequestException(
          'Este item da lista de espera já foi resolvido.',
        );
      }
    }

    // Lista vazia = profissional sem restrição, faz qualquer procedimento.
    if (
      professional.procedures.length > 0 &&
      !professional.procedures.some((p) => p.id === input.procedureId)
    ) {
      throw new BadRequestException(
        'Este profissional não realiza este procedimento.',
      );
    }

    // A duração vem do procedimento — a recepção escolhe o que será feito,
    // não quanto tempo leva.
    const endsAt = new Date(
      input.startsAt.getTime() + procedure.durationMinutes * 60_000,
    );

    await this.businessHours.assertWithinBusinessHours(
      input.tenantId,
      input.startsAt,
      endsAt,
    );

    // Expediente da clínica é o teto; a grade do profissional recorta dentro
    // dele. Clínica aberta 08–18 não significa que este profissional atende
    // às 17h.
    await this.professionalAvailability.assertAvailable(
      input.professionalId,
      input.tenantId,
      input.startsAt,
      endsAt,
    );

    const conflict = await this.appointmentRepository.findOverlapping({
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      startsAt: input.startsAt,
      endsAt,
    });

    if (conflict) {
      throw new ConflictException(
        'Este profissional já tem um agendamento neste horário.',
      );
    }

    const appointment = await this.appointmentRepository.create({
      tenantId: input.tenantId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      procedureId: input.procedureId,
      startsAt: input.startsAt,
      endsAt,
      // Congela o preço praticado: a tabela pode mudar, o histórico não.
      priceInCents: procedure.priceInCents,
      notes: input.notes ?? null,
      origin: input.origin,
    });

    await this.scheduleReminder.execute(appointment.id);

    if (waitlistEntry) {
      // Depois do agendamento criado com sucesso, nunca antes: se isto
      // falhasse primeiro, a fila ficaria fechada com a vaga ainda vazia —
      // o oposto do problema que existia (fila aberta com a vaga já
      // ocupada). Não bloqueia o retorno se der erro: o agendamento é o
      // dado que importa para o paciente, a fila é second-order.
      await this.prisma.waitlistEntry
        .update({
          where: { id: waitlistEntry.id },
          data: {
            status: WaitlistStatus.SCHEDULED,
            appointmentId: appointment.id,
          },
        })
        .catch(() => undefined);
    }

    return appointment;
  }
}
