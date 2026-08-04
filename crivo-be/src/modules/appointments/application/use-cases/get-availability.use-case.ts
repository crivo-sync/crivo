import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repository/appointment.repository';
import { BusinessHoursService } from '../services/business-hours.service';

export type GetAvailabilityInput = {
  tenantId: string;
  professionalId: string;
  procedureId: string;
  /** Dia consultado (a hora é ignorada). */
  date: Date;
  /** Ignora o próprio agendamento — usado ao reagendar. */
  excludeAppointmentId?: string;
};

/**
 * De quanto em quanto tempo um atendimento pode começar. 15min é o menor
 * passo que a recepção usa na prática; a duração real continua vindo do
 * procedimento, isto é só a granularidade das opções oferecidas.
 */
const SLOT_STEP_MINUTES = 15;

/** Teto de segurança: nenhum profissional tem tanto agendamento num dia. */
const MAX_APPOINTMENTS_IN_DAY = 200;

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly businessHours: BusinessHoursService,
  ) {}

  async execute(input: GetAvailabilityInput) {
    // As três leituras são independentes — em série custariam round-trips
    // extras num endpoint que a recepção chama a cada troca de dia.
    const [procedure, professional, config] = await Promise.all([
      this.prisma.procedure.findFirst({
        where: {
          id: input.procedureId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { durationMinutes: true },
      }),
      this.prisma.professional.findFirst({
        where: {
          id: input.professionalId,
          tenantId: input.tenantId,
          deletedAt: null,
          isActive: true,
        },
        select: { procedures: { select: { id: true } } },
      }),
      this.businessHours.getConfig(input.tenantId),
    ]);

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado ou inativo.');
    }

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado ou inativo.');
    }

    if (!config) {
      throw new NotFoundException('Clínica não encontrada.');
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

    const dayStart = new Date(input.date);
    dayStart.setHours(0, 0, 0, 0);

    // Dia fechado: devolve lista vazia com o motivo, em vez de 400 — quem
    // chama está perguntando "o que tem livre?", e "nada, é domingo" é uma
    // resposta válida para renderizar na tela.
    if (!config.businessDays.includes(dayStart.getDay())) {
      return {
        date: dayStart,
        durationMinutes: procedure.durationMinutes,
        slots: [],
        closed: true,
      };
    }

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: appointments } = await this.appointmentRepository.findMany({
      tenantId: input.tenantId,
      professionalId: input.professionalId,
      from: dayStart,
      to: dayEnd,
      page: 1,
      perPage: MAX_APPOINTMENTS_IN_DAY,
    });

    // CANCELLED/NO_SHOW não ocupam a agenda — mesma regra do `findOverlapping`.
    const busy = appointments
      .filter((appointment) =>
        ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(appointment.status),
      )
      .filter((appointment) => appointment.id !== input.excludeAppointmentId)
      .map((appointment) => ({
        start: appointment.startsAt.getTime(),
        end: appointment.endsAt.getTime(),
      }));

    const now = Date.now();
    const slots: { startsAt: Date; endsAt: Date }[] = [];

    for (
      let minutes = config.businessHoursStart;
      // O atendimento inteiro precisa caber antes do fechamento — mesma regra
      // do `assertWithinBusinessHours`, aplicada aqui para nem oferecer o
      // horário que seria recusado no submit.
      minutes + procedure.durationMinutes <= config.businessHoursEnd;
      minutes += SLOT_STEP_MINUTES
    ) {
      const start = new Date(dayStart);
      start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      const end = new Date(
        start.getTime() + procedure.durationMinutes * 60_000,
      );

      if (start.getTime() < now) continue; // horário que já passou

      const overlaps = busy.some(
        (slot) => start.getTime() < slot.end && end.getTime() > slot.start,
      );
      if (overlaps) continue;

      slots.push({ startsAt: start, endsAt: end });
    }

    return {
      date: dayStart,
      durationMinutes: procedure.durationMinutes,
      slots,
      closed: false,
    };
  }
}
