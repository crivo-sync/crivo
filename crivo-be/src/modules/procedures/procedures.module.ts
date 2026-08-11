import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { ProcedureController } from './infrastructure/http/procedure.controller';
import { PrismaProcedureRepository } from './infrastructure/prisma/prisma-procedure.repository';
import { PROCEDURE_REPOSITORY } from './domain/repository/procedure.repository';
import { GetProceduresUseCase } from './application/use-cases/get-procedures.use-case';
import { GetProcedureByIdUseCase } from './application/use-cases/get-procedure-by-id.use-case';
import { CreateProcedureUseCase } from './application/use-cases/create-procedure.use-case';
import { UpdateProcedureUseCase } from './application/use-cases/update-procedure.use-case';
import { DeleteProcedureUseCase } from './application/use-cases/delete-procedure.use-case';
import { GuardsModule } from '../../shared/guards/guards.module';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [ProcedureController],
  providers: [
    {
      provide: PROCEDURE_REPOSITORY,
      useClass: PrismaProcedureRepository,
    },
    GetProceduresUseCase,
    GetProcedureByIdUseCase,
    CreateProcedureUseCase,
    UpdateProcedureUseCase,
    DeleteProcedureUseCase,
  ],
  exports: [PROCEDURE_REPOSITORY],
})
export class ProceduresModule {}
