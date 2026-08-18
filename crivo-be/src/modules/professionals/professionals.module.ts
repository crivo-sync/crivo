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
import { ReplaceScheduleUseCase } from './application/use-cases/replace-schedule.use-case';
import { ManageTimeOffUseCase } from './application/use-cases/manage-time-off.use-case';
import { GetOverLimitStatusUseCase } from './application/use-cases/get-over-limit-status.use-case';
import { ResolveOverLimitUseCase } from './application/use-cases/resolve-over-limit.use-case';
import { ProfessionalScheduleController } from './infrastructure/http/professional-schedule.controller';
import { GuardsModule } from '../../shared/guards/guards.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  // `BillingModule` só para `SyncExtraProfessionalsUseCase`, usado por
  // `DeleteProfessionalUseCase` como rede de segurança para dado legado de
  // antes de 17/08 (ver comentário lá). `CreateProfessionalUseCase` não usa
  // mais — cadastro acima do teto volta a ser sempre recusado.
  imports: [PrismaModule, GuardsModule, BillingModule],
  controllers: [ProfessionalController, ProfessionalScheduleController],
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
    ReplaceScheduleUseCase,
    ManageTimeOffUseCase,
    GetOverLimitStatusUseCase,
    ResolveOverLimitUseCase,
  ],
  exports: [PROFESSIONAL_REPOSITORY],
})
export class ProfessionalsModule {}
