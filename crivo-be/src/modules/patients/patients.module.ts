import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { PatientController } from './infrastructure/http/patient.controller';
import { PrismaPatientRepository } from './infrastructure/prisma/prisma-patient.repository';
import { PATIENT_REPOSITORY } from './domain/repository/patient.repository';
import { GetPatientUseCase } from './application/use-cases/get-patients.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [PatientController],
  providers: [
    {
      provide: PATIENT_REPOSITORY,
      useClass: PrismaPatientRepository,
    },
    GetPatientUseCase,
  ],
  exports: [PATIENT_REPOSITORY],
})
export class PatientsModule {}
