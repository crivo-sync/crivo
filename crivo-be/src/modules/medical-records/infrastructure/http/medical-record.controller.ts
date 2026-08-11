import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
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
import { CreateClinicalNoteDto } from '../dtos/create-clinical-note.dto';
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
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, TrialGuard)
@Roles(Role.ADMIN, Role.PROFESSIONAL)
export class MedicalRecordController {
  constructor(
    private readonly getAnamnesis: GetAnamnesisUseCase,
    private readonly upsertAnamnesis: UpsertAnamnesisUseCase,
    private readonly getClinicalNotes: GetClinicalNotesUseCase,
    private readonly createClinicalNote: CreateClinicalNoteUseCase,
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
}
