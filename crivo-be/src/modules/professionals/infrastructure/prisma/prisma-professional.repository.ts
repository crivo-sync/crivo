import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreateProfessionalData,
  FindManyProfessionalsParams,
  PaginatedProfessionals,
  ProfessionalRepository,
  ProfessionalWithProcedures,
  UpdateProfessionalData,
} from '../../domain/repository/professional.repository';

/**
 * Grade semanal inclusa na listagem de propósito: o Quadro precisa mostrar
 * "quando cada profissional atende" na mesma tela, e buscar por profissional
 * seria N+1 requests por troca de dia. Sem grade cadastrada o array vem
 * vazio — quem consome já trata vazio como "atende o expediente da clínica".
 */
const PROFESSIONAL_INCLUDE = {
  procedures: { select: { id: true, name: true } },
  schedules: {
    select: { weekday: true, startMinutes: true, endMinutes: true },
    orderBy: { weekday: 'asc' },
  },
} satisfies Prisma.ProfessionalInclude;

@Injectable()
export class PrismaProfessionalRepository implements ProfessionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany({
    tenantId,
    search,
    page,
    perPage,
  }: FindManyProfessionalsParams): Promise<PaginatedProfessionals> {
    const where: Prisma.ProfessionalWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { specialty: { contains: search, mode: 'insensitive' } },
              { councilCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.professional.findMany({
        where,
        include: PROFESSIONAL_INCLUDE,
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.professional.count({ where }),
    ]);

    return { data, total };
  }

  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<ProfessionalWithProcedures | null> {
    return this.prisma.professional.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: PROFESSIONAL_INCLUDE,
    });
  }

  create(data: CreateProfessionalData): Promise<ProfessionalWithProcedures> {
    const { procedureIds, ...rest } = data;
    return this.prisma.professional.create({
      data: {
        ...rest,
        procedures: { connect: procedureIds?.map((id) => ({ id })) ?? [] },
      },
      include: PROFESSIONAL_INCLUDE,
    });
  }

  update(
    id: string,
    data: UpdateProfessionalData,
  ): Promise<ProfessionalWithProcedures> {
    const { procedureIds, ...rest } = data;
    return this.prisma.professional.update({
      where: { id },
      data: {
        ...rest,
        ...(procedureIds !== undefined
          ? { procedures: { set: procedureIds.map((id) => ({ id })) } }
          : {}),
      },
      include: PROFESSIONAL_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.professional.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /** Base da cobrança por assento — ver "Modelo de cobrança" no README. */
  countActiveByTenant(tenantId: string): Promise<number> {
    return this.prisma.professional.count({
      where: { tenantId, deletedAt: null, isActive: true },
    });
  }
}
