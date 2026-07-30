import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { ProfessionalController } from './infrastructure/http/professional.controller';
import { PrismaProfessionalRepository } from './infrastructure/prisma/prisma-professional.repository';
import { PROFESSIONAL_REPOSITORY } from './domain/repository/professional.repository';
import { GetProfessionalsUseCase } from './application/use-cases/get-professionals.use-case';
import { GetProfessionalByIdUseCase } from './application/use-cases/get-professional-by-id.use-case';
import { CreateProfessionalUseCase } from './application/use-cases/create-professional.use-case';
import { UpdateProfessionalUseCase } from './application/use-cases/update-professional.use-case';
import { DeleteProfessionalUseCase } from './application/use-cases/delete-professional.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessionalController],
  providers: [
    {
      provide: PROFESSIONAL_REPOSITORY,
      useClass: PrismaProfessionalRepository,
    },
    GetProfessionalsUseCase,
    GetProfessionalByIdUseCase,
    CreateProfessionalUseCase,
    UpdateProfessionalUseCase,
    DeleteProfessionalUseCase,
  ],
  exports: [PROFESSIONAL_REPOSITORY],
})
export class ProfessionalsModule {}
