import { Injectable } from '@nestjs/common';
import { Prisma, Procedure } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreateProcedureData,
  FindManyProceduresParams,
  PaginatedProcedures,
  ProcedureRepository,
  UpdateProcedureData,
} from '../../domain/repository/procedure.repository';

@Injectable()
export class PrismaProcedureRepository implements ProcedureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany({
    tenantId,
    search,
    page,
    perPage,
  }: FindManyProceduresParams): Promise<PaginatedProcedures> {
    const where: Prisma.ProcedureWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.procedure.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.procedure.count({ where }),
    ]);

    return { data, total };
  }

  findByIdAndTenant(id: string, tenantId: string): Promise<Procedure | null> {
    return this.prisma.procedure.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  create(data: CreateProcedureData): Promise<Procedure> {
    return this.prisma.procedure.create({ data });
  }

  update(id: string, data: UpdateProcedureData): Promise<Procedure> {
    return this.prisma.procedure.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.procedure.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
