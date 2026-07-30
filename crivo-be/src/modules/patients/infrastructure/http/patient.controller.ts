import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';
import { paginated } from 'src/shared/dtos/paginated-response.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { CreatePatientDto } from '../dtos/create-patient.dto';
import { UpdatePatientDto } from '../dtos/update-patient.dto';
import { PatientResponseDto } from '../dtos/patient-response.dto';
import { GetPatientsUseCase } from '../../application/use-cases/get-patients.use-case';
import { GetPatientByIdUseCase } from '../../application/use-cases/get-patient-by-id.use-case';
import { CreatePatientUseCase } from '../../application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from '../../application/use-cases/update-patient.use-case';
import { DeletePatientUseCase } from '../../application/use-cases/delete-patient.use-case';

@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, TenantContextGuard)
export class PatientController {
  constructor(
    private readonly getPatients: GetPatientsUseCase,
    private readonly getPatientById: GetPatientByIdUseCase,
    private readonly createPatient: CreatePatientUseCase,
    private readonly updatePatient: UpdatePatientUseCase,
    private readonly deletePatient: DeletePatientUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista os pacientes da clínica (paginado, com busca)',
  })
  @ApiOkResponse({ type: [PatientResponseDto] })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.getPatients.execute({
      tenantId,
      search: query.search,
      page: query.page,
      perPage: query.perPage,
    });

    return paginated(data.map(PatientResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um paciente' })
  @ApiOkResponse({ type: PatientResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    const patient = await this.getPatientById.execute(id, tenantId);

    return PatientResponseDto.fromEntity(patient);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um paciente' })
  @ApiOkResponse({ type: PatientResponseDto })
  async create(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreatePatientDto,
  ) {
    const patient = await this.createPatient.execute({ tenantId, ...dto });

    return PatientResponseDto.fromEntity(patient);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um paciente' })
  @ApiOkResponse({ type: PatientResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    const patient = await this.updatePatient.execute({ id, tenantId, ...dto });

    return PatientResponseDto.fromEntity(patient);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um paciente' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    await this.deletePatient.execute(id, tenantId);
  }
}
