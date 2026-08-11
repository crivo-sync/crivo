import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import {
  CreateTimeOffDto,
  ReplaceScheduleDto,
} from '../dtos/professional-schedule.dto';
import { ReplaceScheduleUseCase } from '../../application/use-cases/replace-schedule.use-case';
import { ManageTimeOffUseCase } from '../../application/use-cases/manage-time-off.use-case';

/**
 * Grade semanal e bloqueios do profissional.
 *
 * Leitura é aberta a qualquer autenticado — a recepção precisa saber quando
 * cada profissional atende para conseguir agendar. Escrita é só ADMIN, igual
 * ao resto do cadastro de profissionais.
 */
@ApiTags('Profissionais')
@ApiBearerAuth()
@Controller('professionals/:professionalId')
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, TrialGuard)
export class ProfessionalScheduleController {
  constructor(
    private readonly replaceSchedule: ReplaceScheduleUseCase,
    private readonly manageTimeOff: ManageTimeOffUseCase,
  ) {}

  @Get('schedule')
  @ApiOperation({ summary: 'Grade semanal do profissional' })
  @ApiOkResponse()
  async findSchedule(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    // Array vazio = sem grade, atende o expediente inteiro da clínica. Quem
    // consome não precisa de caso especial para isso.
    return this.replaceSchedule.list(professionalId, tenantId);
  }

  @Put('schedule')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Substitui a grade semanal inteira (ADMIN)',
  })
  async saveSchedule(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: ReplaceScheduleDto,
  ) {
    return this.replaceSchedule.execute({
      professionalId,
      tenantId,
      windows: dto.windows,
    });
  }

  @Get('time-off')
  @ApiOperation({ summary: 'Bloqueios de agenda do profissional' })
  async findTimeOff(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    return this.manageTimeOff.list(professionalId, tenantId);
  }

  @Post('time-off')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bloqueia um período na agenda (ADMIN)' })
  async addTimeOff(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.manageTimeOff.create({
      professionalId,
      tenantId,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      reason: dto.reason,
    });
  }

  @Delete('time-off/:timeOffId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um bloqueio (ADMIN)' })
  async removeTimeOff(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Param('timeOffId', ParseUUIDPipe) timeOffId: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    await this.manageTimeOff.remove(timeOffId, professionalId, tenantId);
  }
}
