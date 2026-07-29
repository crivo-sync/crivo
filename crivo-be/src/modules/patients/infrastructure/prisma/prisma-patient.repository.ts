import { Injectable } from '@nestjs/common';
import { Patient } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { PatientRepository } from '../../domain/repository/patient.repository';

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
