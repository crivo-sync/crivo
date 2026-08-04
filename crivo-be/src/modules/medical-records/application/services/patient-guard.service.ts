import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

/**
 * Todo acesso ao prontuário entra por `/patients/:id/...`, com o `id` vindo
 * da URL e o `tenantId` do token. Confirmar que o paciente é mesmo da clínica
 * do token é o que impede ler prontuário de outra clínica chutando um uuid —
 * por isso está isolado aqui e é chamado por todos os use cases do módulo.
 */
@Injectable()
export class PatientGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async assertBelongsToTenant(
    patientId: string,
    tenantId: string,
  ): Promise<void> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }
  }
}
