import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';

export type UpdateProfessionalInput = {
  id: string;
  tenantId: string;
  name?: string;
  specialty?: string;
  councilCode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  procedureIds?: string[];
};

@Injectable()
export class UpdateProfessionalUseCase {
  constructor(
    @Inject(PROFESSIONAL_REPOSITORY)
    private readonly professionalRepository: ProfessionalRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute({ id, tenantId, ...changes }: UpdateProfessionalInput) {
    const professional = await this.professionalRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    if (changes.procedureIds?.length) {
      await this.assertProceduresBelongToTenant(
        tenantId,
        changes.procedureIds,
      );
    }

    return this.professionalRepository.update(id, changes);
  }

  // Mesma checagem do cadastro: um payload malformado (ou de outro tenant)
  // não pode linkar procedimento que não é dessa clínica.
  private async assertProceduresBelongToTenant(
    tenantId: string,
    procedureIds: string[],
  ) {
    const found = await this.prisma.procedure.findMany({
      where: { id: { in: procedureIds }, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (found.length !== new Set(procedureIds).size) {
      throw new BadRequestException(
        'Um ou mais procedimentos são inválidos.',
      );
    }
  }
}
