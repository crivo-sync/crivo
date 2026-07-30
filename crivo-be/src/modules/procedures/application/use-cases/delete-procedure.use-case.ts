import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  PROCEDURE_REPOSITORY,
  type ProcedureRepository,
} from '../../domain/repository/procedure.repository';

@Injectable()
export class DeleteProcedureUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY)
    private readonly procedureRepository: ProcedureRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, tenantId: string) {
    const procedure = await this.procedureRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!procedure) {
      throw new NotFoundException('Procedimento não encontrado.');
    }

    const upcoming = await this.prisma.appointment.count({
      where: {
        procedureId: id,
        startsAt: { gte: new Date() },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
    });

    if (upcoming > 0) {
      throw new ConflictException(
        `Este procedimento tem ${upcoming} agendamento(s) futuro(s). Cancele-os antes de removê-lo.`,
      );
    }

    await this.procedureRepository.softDelete(id);
  }
}
