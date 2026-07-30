import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { PatientController } from './infrastructure/http/patient.controller';
import { PrismaPatientRepository } from './infrastructure/prisma/prisma-patient.repository';
import { PATIENT_REPOSITORY } from './domain/repository/patient.repository';
import { GetPatientsUseCase } from './application/use-cases/get-patients.use-case';
import { GetPatientByIdUseCase } from './application/use-cases/get-patient-by-id.use-case';
import { CreatePatientUseCase } from './application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from './application/use-cases/update-patient.use-case';
import { DeletePatientUseCase } from './application/use-cases/delete-patient.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [PatientController],
  providers: [
    {
      provide: PATIENT_REPOSITORY,
      useClass: PrismaPatientRepository,
    },
    GetPatientsUseCase,
    GetPatientByIdUseCase,
    CreatePatientUseCase,
    UpdatePatientUseCase,
    DeletePatientUseCase,
  ],
  exports: [PATIENT_REPOSITORY],
})
export class PatientsModule {}
