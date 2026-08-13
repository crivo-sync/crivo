import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';
import { paginated } from 'src/shared/dtos/paginated-response.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { PlanFeatureGuard } from 'src/shared/guards/plan-feature.guard';
import { RequiresPlanFeature } from 'src/shared/decorators/requires-plan-feature.decorator';
import { assertValidImageUpload } from 'src/shared/validation/image-upload';
import { CreateClinicalNoteDto } from '../dtos/create-clinical-note.dto';
import { UploadClinicalPhotoDto } from '../dtos/upload-clinical-photo.dto';
import { ManageClinicalPhotosUseCase } from '../../application/use-cases/manage-clinical-photos.use-case';
import { UpsertAnamnesisDto } from '../dtos/upsert-anamnesis.dto';
import {
  AnamnesisResponseDto,
  ClinicalNoteResponseDto,
} from '../dtos/medical-record-response.dto';
import { GetAnamnesisUseCase } from '../../application/use-cases/get-anamnesis.use-case';
import { UpsertAnamnesisUseCase } from '../../application/use-cases/upsert-anamnesis.use-case';
import { GetClinicalNotesUseCase } from '../../application/use-cases/get-clinical-notes.use-case';
import { CreateClinicalNoteUseCase } from '../../application/use-cases/create-clinical-note.use-case';

/**
 * Prontuário — dado sensível de saúde (LGPD Art. 11).
 *
 * `@Roles` no **controller inteiro**, e não rota a rota: assim uma rota nova
 * nasce restrita por padrão. A recepção (`STAFF`) não entra aqui — não tem
 * necessidade clínica de ler alergia ou medicação do paciente.
 */
@ApiTags('Prontuário')
@ApiBearerAuth()
@Controller('patients/:patientId')
@UseGuards(
  JwtAuthGuard,
  TenantContextGuard,
  RolesGuard,
  TrialGuard,
  PlanFeatureGuard,
)
@RequiresPlanFeature('hasMedicalRecords')
@Roles(Role.ADMIN, Role.PROFESSIONAL)
export class MedicalRecordController {
  constructor(
    private readonly getAnamnesis: GetAnamnesisUseCase,
    private readonly upsertAnamnesis: UpsertAnamnesisUseCase,
    private readonly getClinicalNotes: GetClinicalNotesUseCase,
    private readonly createClinicalNote: CreateClinicalNoteUseCase,
    private readonly clinicalPhotos: ManageClinicalPhotosUseCase,
  ) {}

  @Get('anamnesis')
  @ApiOperation({
    summary:
      'Ficha de saúde do paciente (ADMIN/PROFESSIONAL). Devolve null se nunca preenchida',
  })
  @ApiOkResponse({ type: AnamnesisResponseDto })
  async findAnamnesis(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    const anamnesis = await this.getAnamnesis.execute(patientId, tenantId);

    return anamnesis ? AnamnesisResponseDto.fromEntity(anamnesis) : null;
  }

  @Put('anamnesis')
  @ApiOperation({ summary: 'Cria ou atualiza a ficha (ADMIN/PROFESSIONAL)' })
  @ApiOkResponse({ type: AnamnesisResponseDto })
  async saveAnamnesis(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Tenant('tenantId') tenantId: string,
    @Tenant('userId') userId: string,
    @Body() dto: UpsertAnamnesisDto,
  ) {
    const anamnesis = await this.upsertAnamnesis.execute({
      patientId,
      tenantId,
      updatedByUserId: userId,
      ...dto,
    });

    return AnamnesisResponseDto.fromEntity(anamnesis);
  }

  @Get('clinical-notes')
  @ApiOperation({
    summary:
      'Histórico de evolução, mais recente primeiro (ADMIN/PROFESSIONAL)',
  })
  @ApiOkResponse({ type: [ClinicalNoteResponseDto] })
  async findClinicalNotes(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Tenant('tenantId') tenantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.getClinicalNotes.execute({
      patientId,
      tenantId,
      page: query.page,
      perPage: query.perPage,
    });

    return paginated(data.map(ClinicalNoteResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  /**
   * Só POST: evolução é append-only. Não existe PUT nem DELETE de propósito —
   * corrigir um registro clínico é adicionar uma nota nova.
   */
  @Post('clinical-notes')
  @ApiOperation({ summary: 'Adiciona uma evolução (ADMIN/PROFESSIONAL)' })
  @ApiOkResponse({ type: ClinicalNoteResponseDto })
  async addClinicalNote(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Tenant('tenantId') tenantId: string,
    @Tenant('userId') userId: string,
    @Body() dto: CreateClinicalNoteDto,
  ) {
    const note = await this.createClinicalNote.execute({
      patientId,
      tenantId,
      authorUserId: userId,
      content: dto.content,
      appointmentId: dto.appointmentId,
    });

    return ClinicalNoteResponseDto.fromEntity(note);
  }

  /**
   * Galeria antes/depois do paciente.
   *
   * As URLs vêm assinadas e **expiram em minutos** — são geradas a cada
   * leitura, nunca guardadas. Por isso não dá para cachear a resposta.
   */
  @Get('photos')
  @ApiOperation({ summary: 'Fotos clínicas do paciente (ADMIN/PROFESSIONAL)' })
  async listPhotos(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    return this.clinicalPhotos.listByPatient(tenantId, patientId);
  }

  @Get('appointments/:appointmentId/photos')
  @ApiOperation({ summary: 'Fotos de um atendimento específico' })
  async listAppointmentPhotos(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    return this.clinicalPhotos.listByAppointment(tenantId, appointmentId);
  }

  @Post('appointments/:appointmentId/photos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string', enum: ['BEFORE', 'AFTER'] },
        caption: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary: 'Envia foto antes/depois de um atendimento (ADMIN/PROFESSIONAL)',
  })
  async uploadPhoto(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Tenant('tenantId') tenantId: string,
    @Tenant('userId') userId: string,
    @Body() dto: UploadClinicalPhotoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    assertValidImageUpload(file);

    return this.clinicalPhotos.upload({
      tenantId,
      appointmentId,
      userId,
      kind: dto.kind,
      caption: dto.caption,
      fileBuffer: file.buffer,
    });
  }

  /**
   * Diferente da evolução (append-only), foto pode ser excluída: a errada —
   * paciente trocado, ou sem consentimento — precisa poder sair, e mantê-la
   * só no storage seria guardar dado sensível que mandaram apagar.
   */
  @Delete('photos/:photoId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui uma foto clínica (ADMIN/PROFESSIONAL)' })
  async removePhoto(
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Tenant('tenantId') tenantId: string,
  ): Promise<void> {
    await this.clinicalPhotos.remove(tenantId, photoId);
  }
}
