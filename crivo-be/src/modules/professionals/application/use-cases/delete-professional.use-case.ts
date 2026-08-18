import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { SyncExtraProfessionalsUseCase } from 'src/modules/billing/application/use-cases/sync-extra-professionals.use-case';
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
    private readonly syncExtraProfessionals: SyncExtraProfessionalsUseCase,
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

    /**
     * Rede de segurança, não parte do fluxo normal.
     *
     * `CreateProfessionalUseCase` voltou a bloquear sempre no teto (17/08,
     * corrigindo um bug que permitia passar do limite pagando adicional —
     * ver o comentário lá), então hoje nenhum cadastro novo gera item de
     * adicional na assinatura. Mas uma clínica que excedeu o limite
     * **enquanto o bug existia** pode ter um item de adicional pendente no
     * Stripe; `syncExtraProfessionals` recalcula do zero pela contagem real
     * e zera esse item quando a remoção volta a clínica para dentro do
     * teto — sem isso ela continuaria sendo cobrada por um profissional que
     * não existe mais.
     */
    await this.syncExtraProfessionals.execute(tenantId);
  }
}
