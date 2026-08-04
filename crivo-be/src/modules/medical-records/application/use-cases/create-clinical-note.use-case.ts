import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import {
  MEDICAL_RECORD_REPOSITORY,
  type ClinicalNoteWithAuthor,
  type MedicalRecordRepository,
} from '../../domain/repository/medical-record.repository';
import { PatientGuardService } from '../services/patient-guard.service';

export type CreateClinicalNoteInput = {
  patientId: string;
  tenantId: string;
  authorUserId: string;
  content: string;
  appointmentId?: string;
};

@Injectable()
export class CreateClinicalNoteUseCase {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly repository: MedicalRecordRepository,
    private readonly patientGuard: PatientGuardService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    input: CreateClinicalNoteInput,
  ): Promise<ClinicalNoteWithAuthor> {
    await this.patientGuard.assertBelongsToTenant(
      input.patientId,
      input.tenantId,
    );

    if (input.appointmentId) {
      await this.assertAppointmentBelongsToPatient(input);
    }

    return this.repository.createClinicalNote({
      tenantId: input.tenantId,
      patientId: input.patientId,
      appointmentId: input.appointmentId ?? null,
      authorUserId: input.authorUserId,
      content: input.content,
    });
  }

  /**
   * Sem esta checagem daria para pendurar uma evolução do paciente A num
   * atendimento do paciente B — o histórico clínico apontaria para a consulta
   * errada, que é justamente o tipo de erro que um prontuário não pode ter.
   */
  private async assertAppointmentBelongsToPatient({
    appointmentId,
    patientId,
    tenantId,
  }: CreateClinicalNoteInput): Promise<void> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId, tenantId },
      select: { id: true },
    });

    if (!appointment) {
      throw new BadRequestException(
        'Atendimento não encontrado para este paciente.',
      );
    }
  }
}
