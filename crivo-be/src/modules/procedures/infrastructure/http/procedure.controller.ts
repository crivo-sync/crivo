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
import { CreateProcedureDto } from '../dtos/create-procedure.dto';
import { UpdateProcedureDto } from '../dtos/update-procedure.dto';
import { ProcedureResponseDto } from '../dtos/procedure-response.dto';
import { GetProceduresUseCase } from '../../application/use-cases/get-procedures.use-case';
import { GetProcedureByIdUseCase } from '../../application/use-cases/get-procedure-by-id.use-case';
import { CreateProcedureUseCase } from '../../application/use-cases/create-procedure.use-case';
import { UpdateProcedureUseCase } from '../../application/use-cases/update-procedure.use-case';
import { DeleteProcedureUseCase } from '../../application/use-cases/delete-procedure.use-case';

@ApiTags('Procedimentos')
@ApiBearerAuth()
@Controller('procedures')
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
export class ProcedureController {
  constructor(
    private readonly getProcedures: GetProceduresUseCase,
    private readonly getProcedureById: GetProcedureByIdUseCase,
    private readonly createProcedure: CreateProcedureUseCase,
    private readonly updateProcedure: UpdateProcedureUseCase,
    private readonly deleteProcedure: DeleteProcedureUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista os procedimentos da clínica' })
  @ApiOkResponse({ type: [ProcedureResponseDto] })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.getProcedures.execute({
      tenantId,
      search: query.search,
      page: query.page,
      perPage: query.perPage,
    });

    return paginated(data.map(ProcedureResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um procedimento' })
  @ApiOkResponse({ type: ProcedureResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    const procedure = await this.getProcedureById.execute(id, tenantId);

    return ProcedureResponseDto.fromEntity(procedure);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cadastra um procedimento (ADMIN)' })
  @ApiOkResponse({ type: ProcedureResponseDto })
  async create(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: CreateProcedureDto,
  ) {
    const procedure = await this.createProcedure.execute({ tenantId, ...dto });

    return ProcedureResponseDto.fromEntity(procedure);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza um procedimento (ADMIN)' })
  @ApiOkResponse({ type: ProcedureResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
    @Body() dto: UpdateProcedureDto,
  ) {
    const procedure = await this.updateProcedure.execute({
      id,
      tenantId,
      ...dto,
    });

    return ProcedureResponseDto.fromEntity(procedure);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um procedimento (ADMIN)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('tenantId') tenantId: string,
  ) {
    await this.deleteProcedure.execute(id, tenantId);
  }
}
