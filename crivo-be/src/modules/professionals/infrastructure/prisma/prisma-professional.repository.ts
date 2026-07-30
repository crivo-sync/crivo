import { Injectable } from '@nestjs/common';
import { Prisma, Professional } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  CreateProfessionalData,
  FindManyProfessionalsParams,
  PaginatedProfessionals,
  ProfessionalRepository,
  UpdateProfessionalData,
} from '../../domain/repository/professional.repository';

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
  ): Promise<Professional | null> {
    return this.prisma.professional.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  create(data: CreateProfessionalData): Promise<Professional> {
    return this.prisma.professional.create({ data });
  }

  update(id: string, data: UpdateProfessionalData): Promise<Professional> {
    return this.prisma.professional.update({ where: { id }, data });
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
