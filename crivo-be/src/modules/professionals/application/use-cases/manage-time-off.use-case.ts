import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

export type CreateTimeOffInput = {
  professionalId: string;
  tenantId: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string;
};

@Injectable()
export class ManageTimeOffUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async list(professionalId: string, tenantId: string) {
    await this.assertProfessional(professionalId, tenantId);

    return this.prisma.professionalTimeOff.findMany({
      where: { professionalId, tenantId },
      orderBy: { startsAt: 'desc' },
    });
  }

  async create({
    professionalId,
    tenantId,
    startsAt,
    endsAt,
    reason,
  }: CreateTimeOffInput) {
    await this.assertProfessional(professionalId, tenantId);

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'O fim do bloqueio precisa ser depois do início.',
      );
    }

    // Avisar sobre agendamento existente em vez de cancelá-lo em silêncio:
    // remarcar paciente é decisão da clínica, não efeito colateral de
    // cadastrar férias.
    const conflicting = await this.prisma.appointment.count({
      where: {
        professionalId,
        tenantId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (conflicting > 0) {
      throw new BadRequestException(
        `Há ${conflicting} agendamento(s) marcado(s) nesse período. Remarque-os antes de bloquear a agenda.`,
      );
    }

    return this.prisma.professionalTimeOff.create({
      data: {
        professionalId,
        tenantId,
        startsAt,
        endsAt,
        reason: reason ?? null,
      },
    });
  }

  async remove(id: string, professionalId: string, tenantId: string) {
    // `deleteMany` com tenant no where: um id de outra clínica simplesmente
    // não encontra nada, em vez de apagar o bloqueio errado.
    const { count } = await this.prisma.professionalTimeOff.deleteMany({
      where: { id, professionalId, tenantId },
    });

    if (count === 0) {
      throw new NotFoundException('Bloqueio não encontrado.');
    }
  }

  private async assertProfessional(
    professionalId: string,
    tenantId: string,
  ): Promise<void> {
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }
  }
}
