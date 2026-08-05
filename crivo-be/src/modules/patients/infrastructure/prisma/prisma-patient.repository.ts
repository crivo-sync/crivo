import { Injectable } from '@nestjs/common';
import { Patient, Prisma } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreatePatientData,
  ExistingPatientKey,
  FindManyPatientsParams,
  PaginatedPatients,
  PatientRepository,
  UpdatePatientData,
} from '../../domain/repository/patient.repository';

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany({
    tenantId,
    search,
    page,
    perPage,
  }: FindManyPatientsParams): Promise<PaginatedPatients> {
    const where: Prisma.PatientWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { cpf: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total };
  }

  findByIdAndTenant(id: string, tenantId: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({
      where: { cpf, tenantId, deletedAt: null },
    });
  }

  async findExistingKeys({
    tenantId,
    cpfs,
    phones,
  }: {
    tenantId: string;
    cpfs: string[];
    phones: string[];
  }): Promise<ExistingPatientKey[]> {
    // Sem nenhuma chave para procurar, um `OR: []` traria a base inteira.
    if (cpfs.length === 0 && phones.length === 0) return [];

    return this.prisma.patient.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          ...(cpfs.length > 0 ? [{ cpf: { in: cpfs } }] : []),
          ...(phones.length > 0 ? [{ phone: { in: phones } }] : []),
        ],
      },
      select: { cpf: true, phone: true },
    });
  }

  create(data: CreatePatientData): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }

  async createMany(data: CreatePatientData[]): Promise<number> {
    const { count } = await this.prisma.patient.createMany({ data });

    return count;
  }

  update(id: string, data: UpdatePatientData): Promise<Patient> {
    return this.prisma.patient.update({ where: { id }, data });
  }

  /**
   * Soft delete. O CPF é liberado junto (movido para `cpf_deleted_<timestamp>`)
   * porque `@@unique([tenantId, cpf])` bloquearia recadastrar a mesma pessoa
   * depois de excluída.
   */
  async delete(id: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      select: { cpf: true },
    });

    await this.prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        ...(patient?.cpf ? { cpf: `${patient.cpf}_del_${Date.now()}` } : {}),
      },
    });
  }
}
