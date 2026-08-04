import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  AnamnesisWithAuthor,
  ClinicalNoteWithAuthor,
  CreateClinicalNoteData,
  FindClinicalNotesParams,
  MedicalRecordRepository,
  PaginatedClinicalNotes,
  UpsertAnamnesisData,
} from '../../domain/repository/medical-record.repository';

const WITH_UPDATED_BY = {
  updatedByUser: { select: { id: true, name: true } },
} satisfies Prisma.AnamnesisInclude;

const WITH_AUTHOR = {
  author: { select: { id: true, name: true } },
} satisfies Prisma.ClinicalNoteInclude;

@Injectable()
export class PrismaMedicalRecordRepository implements MedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAnamnesisByPatient(
    patientId: string,
    tenantId: string,
  ): Promise<AnamnesisWithAuthor | null> {
    // `tenantId` no where, e não só o `patientId` único: garante que um id de
    // paciente de outra clínica não devolva ficha nenhuma.
    return this.prisma.anamnesis.findFirst({
      where: { patientId, tenantId },
      include: WITH_UPDATED_BY,
    });
  }

  upsertAnamnesis(data: UpsertAnamnesisData): Promise<AnamnesisWithAuthor> {
    const { tenantId, patientId, updatedByUserId, ...fields } = data;

    return this.prisma.anamnesis.upsert({
      where: { patientId },
      create: { tenantId, patientId, updatedByUserId, ...fields },
      update: { updatedByUserId, ...fields },
      include: WITH_UPDATED_BY,
    });
  }

  async findClinicalNotes({
    tenantId,
    patientId,
    page,
    perPage,
  }: FindClinicalNotesParams): Promise<PaginatedClinicalNotes> {
    const where: Prisma.ClinicalNoteWhereInput = { tenantId, patientId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.clinicalNote.findMany({
        where,
        include: WITH_AUTHOR,
        // Mais recente primeiro: a última evolução é a que interessa ao abrir.
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.clinicalNote.count({ where }),
    ]);

    return { data, total };
  }

  createClinicalNote(
    data: CreateClinicalNoteData,
  ): Promise<ClinicalNoteWithAuthor> {
    return this.prisma.clinicalNote.create({
      data,
      include: WITH_AUTHOR,
    });
  }
}
