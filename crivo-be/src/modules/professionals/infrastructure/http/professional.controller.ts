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
import { CreateProfessionalDto } from '../dtos/create-professional.dto';
import { UpdateProfessionalDto } from '../dtos/update-professional.dto';
import { ProfessionalResponseDto } from '../dtos/professional-response.dto';
import { GetProfessionalsUseCase } from '../../application/use-cases/get-professionals.use-case';
import { GetProfessionalByIdUseCase } from '../../application/use-cases/get-professional-by-id.use-case';
import { CreateProfessionalUseCase } from '../../application/use-cases/create-professional.use-case';
import { UpdateProfessionalUseCase } from '../../application/use-cases/update-professional.use-case';
import { DeleteProfessionalUseCase } from '../../application/use-cases/delete-professional.use-case';

@ApiTags('Profissionais')
@ApiBearerAuth()
@Controller('professionals')
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, TrialGuard)
export class ProfessionalController {
  constructor(
    private readonly getProfessionals: GetProfessionalsUseCase,
    private readonly getProfessionalById: GetProfessionalByIdUseCase,
    private readonly createProfessional: CreateProfessionalUseCase,
    private readonly updateProfessional: UpdateProfessionalUseCase,
    private readonly deleteProfessional: DeleteProfessionalUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista os profissionais da clínica' })
  @ApiOkResponse({ type: [ProfessionalResponseDto] })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.getProfessionals.execute({
      tenantId,
      search: query.search,
      page: query.page,
      perPage: query.perPage,
    });

    return paginated(data.map(ProfessionalResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um profissional' })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    const professional = await this.getProfessionalById.execute(id, tenantId);

    return ProfessionalResponseDto.fromEntity(professional);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cadastra um profissional (ADMIN)' })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  async create(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreateProfessionalDto,
  ) {
    const professional = await this.createProfessional.execute({
      tenantId,
      ...dto,
    });

    return ProfessionalResponseDto.fromEntity(professional);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza um profissional (ADMIN)' })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    const professional = await this.updateProfessional.execute({
      id,
      tenantId,
      ...dto,
    });

    return ProfessionalResponseDto.fromEntity(professional);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um profissional (ADMIN)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    await this.deleteProfessional.execute(id, tenantId);
  }
}
