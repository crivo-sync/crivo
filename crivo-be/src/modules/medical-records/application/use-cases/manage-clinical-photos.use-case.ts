import { Injectable, NotFoundException } from '@nestjs/common';
import type { ClinicalPhotoKind } from '@prisma/client';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { CloudinaryService } from 'src/shared/infrastructure/cloudinary/cloudinary.service';
import { PatientGuardService } from '../services/patient-guard.service';

/**
 * Quanto tempo a URL assinada vale.
 *
 * Curto de propósito: a URL é gerada a cada leitura da galeria, então
 * expirar rápido não atrapalha o uso — e limita a janela em que um link
 * copiado (histórico, print, WhatsApp) ainda abre a foto.
 */
const SIGNED_URL_TTL_SECONDS = 300;

/** Miniatura da grade. O original nunca é transformado no upload. */
const THUMB = [{ width: 400, height: 400, crop: 'fill' as const }];

export type ClinicalPhotoView = {
  id: string;
  kind: ClinicalPhotoKind;
  caption: string | null;
  createdAt: Date;
  uploadedBy: string;
  /** Temporária — some depois de `SIGNED_URL_TTL_SECONDS`. */
  url: string;
  thumbnailUrl: string;
};

@Injectable()
export class ManageClinicalPhotosUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly patientGuard: PatientGuardService,
  ) {}

  /**
   * Fotos de um atendimento, com URLs assinadas geradas na hora.
   *
   * Nunca guardamos URL pronta no banco: ela expira, e um campo com link
   * morto é pior que campo nenhum.
   */
  async listByAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<ClinicalPhotoView[]> {
    const photos = await this.prisma.clinicalPhoto.findMany({
      where: { tenantId, appointmentId },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
      include: { uploadedBy: { select: { name: true } } },
    });

    return photos.map((photo) => this.toView(photo));
  }

  /** Todas as fotos do paciente — a galeria "antes/depois" ao longo do tempo. */
  async listByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<ClinicalPhotoView[]> {
    await this.patientGuard.assertBelongsToTenant(patientId, tenantId);

    const photos = await this.prisma.clinicalPhoto.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { name: true } } },
    });

    return photos.map((photo) => this.toView(photo));
  }

  async upload(input: {
    tenantId: string;
    appointmentId: string;
    userId: string;
    kind: ClinicalPhotoKind;
    caption?: string;
    fileBuffer: Buffer;
  }): Promise<ClinicalPhotoView> {
    // O atendimento define paciente, data e procedimento — e confere o
    // tenant de quebra. Sem isso daria para anexar foto ao atendimento de
    // outra clínica sabendo o UUID.
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: input.appointmentId, tenantId: input.tenantId },
      select: { id: true, patientId: true },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    const uploaded = await this.cloudinary.uploadPrivateImage(
      input.fileBuffer,
      // Pasta por tenant e paciente: facilita auditoria e uma eventual
      // exclusão em massa por titular (LGPD).
      `crivo/${input.tenantId}/pacientes/${appointment.patientId}`,
      `${input.appointmentId}-${input.kind.toLowerCase()}-${Date.now()}`,
    );

    const photo = await this.prisma.clinicalPhoto.create({
      data: {
        tenantId: input.tenantId,
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        kind: input.kind,
        caption: input.caption?.trim() || null,
        storageKey: uploaded.public_id,
        uploadedByUserId: input.userId,
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    return this.toView(photo);
  }

  /**
   * Exclui a foto e o arquivo no Cloudinary.
   *
   * Diferente da evolução clínica (append-only): foto errada — do paciente
   * trocado, ou tirada sem consentimento — precisa poder sair, e mantê-la
   * "só no storage" seria guardar dado sensível que a clínica mandou apagar.
   */
  async remove(tenantId: string, photoId: string): Promise<void> {
    const photo = await this.prisma.clinicalPhoto.findFirst({
      where: { id: photoId, tenantId },
    });

    if (!photo) {
      throw new NotFoundException('Foto não encontrada.');
    }

    // Storage primeiro: se falhar, o registro continua e dá para tentar de
    // novo. Na ordem inversa, um erro deixaria arquivo órfão sem ninguém
    // sabendo que ele existe.
    await this.cloudinary.destroyPrivateImage(photo.storageKey);
    await this.prisma.clinicalPhoto.delete({ where: { id: photo.id } });
  }

  private toView(photo: {
    id: string;
    kind: ClinicalPhotoKind;
    caption: string | null;
    createdAt: Date;
    storageKey: string;
    uploadedBy: { name: string };
  }): ClinicalPhotoView {
    return {
      id: photo.id,
      kind: photo.kind,
      caption: photo.caption,
      createdAt: photo.createdAt,
      uploadedBy: photo.uploadedBy.name,
      url: this.cloudinary.signedUrl(photo.storageKey, {
        expiresInSeconds: SIGNED_URL_TTL_SECONDS,
      }),
      thumbnailUrl: this.cloudinary.signedUrl(photo.storageKey, {
        expiresInSeconds: SIGNED_URL_TTL_SECONDS,
        transformation: THUMB,
      }),
    };
  }
}
