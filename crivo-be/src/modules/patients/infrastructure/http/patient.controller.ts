import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PatientResponseDto } from '../dtos/patient-response.dto';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { GetPatientUseCase } from '../../application/use-cases/get-patients.use-case';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, TenantContextGuard)
@ApiOkResponse({ type: [PatientResponseDto] })
export class PatientController {
  constructor(private readonly getPatients: GetPatientUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listagem de pacientes' })
  async finAll(@Tenant('tenantId') tenantId: string) {
    return this.getPatients.execute(tenantId);
  }
}
