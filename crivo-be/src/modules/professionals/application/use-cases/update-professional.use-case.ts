import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  PROFESSIONAL_REPOSITORY,
  type ProfessionalRepository,
} from '../../domain/repository/professional.repository';
import {
  countProfessionalsOccupyingSeat,
  resolveTrialProfessionalLimit,
} from '../professional-limit';

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
      await this.assertProceduresBelongToTenant(tenantId, changes.procedureIds);
    }

    // Reativar ocupa vaga, igual a cadastrar. Sem isto, o limite tinha uma
    // porta dos fundos: desativa dois, reativa os dois, e a clínica volta a
    // ficar acima do teto sem passar por lugar nenhum que checasse.
    if (changes.isActive === true && !professional.isActive) {
      await this.assertSeatAvailable(tenantId);
    }

    return this.professionalRepository.update(id, changes);
  }

  private async assertSeatAvailable(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: { select: { maxProfessionals: true, name: true } } },
    });

    const limite = tenant.plan
      ? tenant.plan.maxProfessionals
      : await resolveTrialProfessionalLimit(this.prisma);

    if (limite === null) return;

    const ocupadas = await countProfessionalsOccupyingSeat(
      this.prisma,
      tenantId,
    );

    if (ocupadas >= limite) {
      throw new ForbiddenException(
        `Seu plano permite até ${limite} profissional(is) ativo(s). Desative outro profissional ou faça upgrade em Configurações → Assinatura.`,
      );
    }
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
      throw new BadRequestException('Um ou mais procedimentos são inválidos.');
    }
  }
}
