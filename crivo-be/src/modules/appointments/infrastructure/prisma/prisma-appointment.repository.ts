import { Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  AppointmentRepository,
  AppointmentWithRelations,
  CreateAppointmentData,
  FindManyAppointmentsParams,
  FindOverlappingParams,
  PaginatedAppointments,
  UpdateAppointmentData,
} from '../../domain/repository/appointment.repository';

/** Campos das relações necessários para montar a agenda. */
const RELATIONS = {
  patient: { select: { id: true, name: true, phone: true } },
  professional: { select: { id: true, name: true } },
  procedure: { select: { id: true, name: true, durationMinutes: true } },
} satisfies Prisma.AppointmentInclude;

/** Status que ocupam a agenda; cancelado e falta liberam o horário. */
const BLOCKING_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
];

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany({
    tenantId,
    from,
    to,
    professionalId,
    patientId,
    status,
    page,
    perPage,
  }: FindManyAppointmentsParams): Promise<PaginatedAppointments> {
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      ...(professionalId ? { professionalId } : {}),
      ...(patientId ? { patientId } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: RELATIONS,
        orderBy: { startsAt: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total };
  }

  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: RELATIONS,
    });
  }

  /**
   * Dois intervalos se sobrepõem quando `inicioA < fimB` E `fimA > inicioB`.
   * Encostar não é conflito: um atendimento que termina 10:00 e outro que
   * começa 10:00 convivem.
   */
  findOverlapping({
    tenantId,
    professionalId,
    startsAt,
    endsAt,
    excludeAppointmentId,
  }: FindOverlappingParams): Promise<Appointment | null> {
    return this.prisma.appointment.findFirst({
      where: {
        tenantId,
        professionalId,
        status: { in: BLOCKING_STATUSES },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });
  }

  create(data: CreateAppointmentData): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }

  update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    return this.prisma.appointment.update({ where: { id }, data });
  }
}
