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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';
import { paginated } from 'src/shared/dtos/paginated-response.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { assertValidCsvUpload } from 'src/shared/validation/csv-upload';
import { CreatePatientDto } from '../dtos/create-patient.dto';
import { ImportPatientsResponseDto } from '../dtos/import-patients.dto';
import { UpdatePatientDto } from '../dtos/update-patient.dto';
import { PatientResponseDto } from '../dtos/patient-response.dto';
import { GetPatientsUseCase } from '../../application/use-cases/get-patients.use-case';
import { GetPatientByIdUseCase } from '../../application/use-cases/get-patient-by-id.use-case';
import { CreatePatientUseCase } from '../../application/use-cases/create-patient.use-case';
import { UpdatePatientUseCase } from '../../application/use-cases/update-patient.use-case';
import { DeletePatientUseCase } from '../../application/use-cases/delete-patient.use-case';
import { ImportPatientsUseCase } from '../../application/use-cases/import-patients.use-case';

@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, TenantContextGuard, TrialGuard)
export class PatientController {
  constructor(
    private readonly getPatients: GetPatientsUseCase,
    private readonly getPatientById: GetPatientByIdUseCase,
    private readonly createPatient: CreatePatientUseCase,
    private readonly updatePatient: UpdatePatientUseCase,
    private readonly deletePatient: DeletePatientUseCase,
    private readonly importPatients: ImportPatientsUseCase,
  ) {}

  /**
   * Importação em massa. Restrita a ADMIN: é operação de implantação, não de
   * atendimento — e um arquivo com a coluna errada suja a base inteira de uma
   * vez, ao contrário do cadastro manual.
   *
   * Com `dryRun=true` nada é gravado; é o que a tela chama para mostrar a
   * prévia antes de confirmar.
   */
  @Post('import')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        dryRun: {
          type: 'string',
          enum: ['true', 'false'],
          description: 'true simula a importação sem gravar nada',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Importa pacientes de um CSV (ADMIN). Use dryRun para simular',
  })
  @ApiOkResponse({ type: ImportPatientsResponseDto })
  async import(
    @Tenant('tenantId') tenantId: string,
    @Body('dryRun') dryRun?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    assertValidCsvUpload(file);

    // Vem como texto pelo multipart. O default é simular: se o campo chegar
    // ausente ou torto, o pior caso é não gravar nada.
    const result = await this.importPatients.execute({
      tenantId,
      fileBuffer: file.buffer,
      dryRun: dryRun !== 'false',
    });

    return ImportPatientsResponseDto.fromResult(result);
  }

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
