import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { MEDICAL_RECORD_REPOSITORY } from './domain/repository/medical-record.repository';
import { PrismaMedicalRecordRepository } from './infrastructure/prisma/prisma-medical-record.repository';
import { MedicalRecordController } from './infrastructure/http/medical-record.controller';
import { PatientGuardService } from './application/services/patient-guard.service';
import { GetAnamnesisUseCase } from './application/use-cases/get-anamnesis.use-case';
import { UpsertAnamnesisUseCase } from './application/use-cases/upsert-anamnesis.use-case';
import { GetClinicalNotesUseCase } from './application/use-cases/get-clinical-notes.use-case';
import { CreateClinicalNoteUseCase } from './application/use-cases/create-clinical-note.use-case';
import { CloudinaryModule } from '../../shared/infrastructure/cloudinary/cloudinary.module';
import { ManageClinicalPhotosUseCase } from './application/use-cases/manage-clinical-photos.use-case';
import { GuardsModule } from '../../shared/guards/guards.module';

@Module({
  imports: [PrismaModule, GuardsModule, CloudinaryModule],
  controllers: [MedicalRecordController],
  providers: [
    {
      provide: MEDICAL_RECORD_REPOSITORY,
      useClass: PrismaMedicalRecordRepository,
    },
    PatientGuardService,
    GetAnamnesisUseCase,
    UpsertAnamnesisUseCase,
    GetClinicalNotesUseCase,
    CreateClinicalNoteUseCase,
    ManageClinicalPhotosUseCase,
  ],
})
export class MedicalRecordsModule {}
