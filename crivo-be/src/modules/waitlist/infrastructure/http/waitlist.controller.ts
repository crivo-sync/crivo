import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WaitlistStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { ManageWaitlistUseCase } from '../../application/manage-waitlist.use-case';

export class AddToWaitlistDto {
  @ApiProperty()
  @IsUUID()
  patientId!: string;

  @ApiProperty()
  @IsUUID()
  procedureId!: string;

  @ApiPropertyOptional({ description: 'Ausente = aceita qualquer profissional' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'Início da janela aceita' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  preferredFrom?: Date;

  @ApiPropertyOptional({ description: 'Fim da janela aceita' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  preferredTo?: Date;

  @ApiPropertyOptional({ example: 'Só de manhã; avisar pelo fixo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class MarkOfferedDto {
  @ApiPropertyOptional({
    description:
      'Vaga que motivou a oferta. Presente = manda o aviso no WhatsApp; ' +
      'ausente = só registra que a recepção avisou por fora.',
  })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}

export class QueryWaitlistDto {
  @ApiPropertyOptional({ enum: WaitlistStatus })
  @IsOptional()
  @IsEnum(WaitlistStatus)
  status?: WaitlistStatus;

  @ApiPropertyOptional({ description: 'Inclui quem já saiu da fila' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeResolved?: boolean;
}

/**
 * Lista de espera.
 *
 * Sem `@Roles`: montar e trabalhar a fila é rotina da recepção — restringir
 * a ADMIN esvaziaria a função.
 */
@ApiTags('Lista de espera')
@ApiBearerAuth()
@Controller('waitlist')
@UseGuards(JwtAuthGuard, TenantContextGuard)
export class WaitlistController {
  constructor(private readonly manageWaitlist: ManageWaitlistUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Quem está esperando vaga, por ordem de chegada' })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryWaitlistDto,
  ) {
    const data = await this.manageWaitlist.list(tenantId, {
      status: query.status,
      includeResolved: query.includeResolved,
    });

    return { data, total: data.length };
  }

  @Post()
  @ApiOperation({ summary: 'Coloca um paciente na lista de espera' })
  async add(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: AddToWaitlistDto,
  ) {
    return this.manageWaitlist.add({ tenantId, ...dto });
  }

  @Get('candidates/:appointmentId')
  @ApiOperation({
    summary:
      'Quem da fila serve para a vaga deste agendamento (sugestão, não oferta)',
  })
  async candidates(
    @Tenant('tenantId') tenantId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.manageWaitlist.candidatesForSlot(tenantId, appointmentId);
  }

  @Patch(':id/offered')
  @ApiOperation({
    summary:
      'Registra a oferta e, com `appointmentId`, avisa o paciente no WhatsApp',
  })
  async markOffered(
    @Tenant('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: MarkOfferedDto,
  ) {
    return this.manageWaitlist.markOffered(id, tenantId, dto.appointmentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Tira o paciente da fila' })
  async remove(
    @Tenant('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.manageWaitlist.remove(id, tenantId);
  }
}
