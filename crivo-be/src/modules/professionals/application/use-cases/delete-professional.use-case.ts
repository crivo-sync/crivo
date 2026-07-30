import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

@Injectable()
export class DeleteProfessionalUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, tenantId: string) {
    const professional = await this.professionalRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    // Remover alguém com agenda futura deixaria pacientes com consulta órfã.
    const upcoming = await this.prisma.appointment.count({
      where: {
        professionalId: id,
        startsAt: { gte: new Date() },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
    });

    if (upcoming > 0) {
      throw new ConflictException(
        `Este profissional tem ${upcoming} agendamento(s) futuro(s). Cancele ou realoque antes de removê-lo.`,
      );
    }

    await this.professionalRepository.softDelete(id);
  }
}
