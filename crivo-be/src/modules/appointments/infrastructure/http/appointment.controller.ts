import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { paginated } from 'src/shared/dtos/paginated-response.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { RescheduleAppointmentDto } from '../dtos/reschedule-appointment.dto';
import { ChangeAppointmentStatusDto } from '../dtos/change-status.dto';
import { QueryAppointmentsDto } from '../dtos/query-appointments.dto';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { GetAppointmentsUseCase } from '../../application/use-cases/get-appointments.use-case';
import { GetAppointmentByIdUseCase } from '../../application/use-cases/get-appointment-by-id.use-case';
import { CreateAppointmentUseCase } from '../../application/use-cases/create-appointment.use-case';
import { RescheduleAppointmentUseCase } from '../../application/use-cases/reschedule-appointment.use-case';
import { ChangeAppointmentStatusUseCase } from '../../application/use-cases/change-appointment-status.use-case';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, TenantContextGuard)
export class AppointmentController {
  constructor(
    private readonly getAppointments: GetAppointmentsUseCase,
    private readonly getAppointmentById: GetAppointmentByIdUseCase,
    private readonly createAppointment: CreateAppointmentUseCase,
    private readonly rescheduleAppointment: RescheduleAppointmentUseCase,
    private readonly changeStatus: ChangeAppointmentStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Agenda do tenant — filtra por período, profissional, paciente e status',
  })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryAppointmentsDto,
  ) {
    const { data, total } = await this.getAppointments.execute({
      tenantId,
      from: query.from,
      to: query.to,
      professionalId: query.professionalId,
      patientId: query.patientId,
      status: query.status,
      page: query.page,
      perPage: query.perPage,
    });

    return paginated(data.map(AppointmentResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um agendamento' })
  @ApiOkResponse({ type: AppointmentResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    const appointment = await this.getAppointmentById.execute(id, tenantId);

    return AppointmentResponseDto.fromEntity(appointment);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria um agendamento (duração e preço vêm do procedimento)',
  })
  async create(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    const appointment = await this.createAppointment.execute({
      tenantId,
      ...dto,
    });

    return AppointmentResponseDto.fromPlain(appointment);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reagenda mantendo a duração do procedimento' })
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.rescheduleAppointment.execute({
      id,
      tenantId,
      ...dto,
    });

    return AppointmentResponseDto.fromPlain(appointment);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Muda o status (confirmar, concluir, cancelar, marcar falta)',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: ChangeAppointmentStatusDto,
  ) {
    const appointment = await this.changeStatus.execute({
      id,
      tenantId,
      ...dto,
    });

    return AppointmentResponseDto.fromPlain(appointment);
  }
}
