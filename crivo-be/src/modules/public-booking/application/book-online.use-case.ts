import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentOrigin } from '@prisma/client';

import { CreateAppointmentUseCase } from 'src/modules/appointments/application/use-cases/create-appointment.use-case';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

export type BookOnlineInput = {
  subdomain: string;
  patientName: string;
  patientPhone: string;
  professionalId: string;
  procedureId: string;
  startsAt: Date;
  notes?: string;
};

/**
 * Agendamento feito pelo próprio paciente, na página pública da clínica.
 *
 * **Rota sem autenticação.** Quem determina a clínica é o subdomínio, e todo
 * id recebido é conferido contra ele — sem isso, alguém marcaria consulta na
 * clínica A usando o id de um profissional da clínica B.
 *
 * Não reimplementa regra de agenda: delega ao `CreateAppointmentUseCase`, o
 * mesmo do painel. Duplicar aqui as validações de expediente, grade e
 * conflito garantiria que as duas cópias divergissem — e a pública é
 * justamente a que não pode falhar em silêncio.
 */
@Injectable()
export class BookOnlineUseCase {
  private readonly logger = new Logger(BookOnlineUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly createAppointment: CreateAppointmentUseCase,
  ) {}

  async execute(input: BookOnlineInput) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { subdomain: input.subdomain, isActive: true },
      select: { id: true, name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Clínica não encontrada.');
    }

    // Os dois precisam ser DESTA clínica. É a checagem que impede usar um id
    // de outro tenant, que a rota pública não tem como barrar de outro jeito.
    const [professional, procedure] = await Promise.all([
      this.prisma.professional.findFirst({
        where: {
          id: input.professionalId,
          tenantId: tenant.id,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.procedure.findFirst({
        where: {
          id: input.procedureId,
          tenantId: tenant.id,
          isActive: true,
        },
        select: { id: true },
      }),
    ]);

    if (!professional || !procedure) {
      throw new NotFoundException(
        'Profissional ou procedimento não disponível nesta clínica.',
      );
    }

    const patientId = await this.resolvePatient(tenant.id, input);

    const appointment = await this.createAppointment.execute({
      tenantId: tenant.id,
      patientId,
      professionalId: input.professionalId,
      procedureId: input.procedureId,
      startsAt: input.startsAt,
      notes: input.notes,
      // Marca a origem: a recepção precisa saber que este cadastro entrou
      // sem triagem, e que o horário foi ocupado por alguém que ela não
      // atendeu.
      origin: AppointmentOrigin.ONLINE,
    });

    this.logger.log(
      `Agendamento online criado na clínica ${tenant.name} (${appointment.id})`,
    );

    return { appointment, clinicName: tenant.name };
  }

  /**
   * Acha o paciente pelo telefone, ou cadastra um novo.
   *
   * Reusar o cadastro existente evita duplicar a mesma pessoa a cada
   * agendamento online — e preserva o histórico de faltas, que é o que
   * alimenta a predição.
   */
  private async resolvePatient(
    tenantId: string,
    input: BookOnlineInput,
  ): Promise<string> {
    const phone = input.patientPhone.replace(/\D/g, '');

    if (phone.length < 10) {
      throw new BadRequestException('Telefone inválido.');
    }

    // Find-or-create **serializado** por (tenant, telefone): duas requisições
    // simultâneas do mesmo telefone na página pública passavam as duas no
    // `findFirst` e as duas criavam — paciente duplicado, histórico de faltas
    // dividido entre dois registros (bug de 21/08/2026).
    //
    // `pg_advisory_xact_lock` faz a segunda transação esperar a primeira
    // terminar, e então ACHA o paciente que já foi criado. É a proteção certa
    // porque telefone NÃO é identidade rígida no Crivo Sync — o import de pacientes
    // aceita duas pessoas com o mesmo número quando uma tem CPF —, então uma
    // `@@unique([tenantId, phone])` quebraria esse caso legítimo.
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${`${tenantId}:${phone}`}))
      `;

      const existing = await tx.patient.findFirst({
        where: { tenantId, phone, deletedAt: null },
        select: { id: true },
      });

      if (existing) return existing.id;

      const created = await tx.patient.create({
        data: { tenantId, name: input.patientName.trim(), phone },
        select: { id: true },
      });

      return created.id;
    });
  }
}
