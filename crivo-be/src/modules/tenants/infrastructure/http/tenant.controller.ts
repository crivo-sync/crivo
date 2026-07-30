import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { GetTenantUseCase } from '../../application/use-cases/get-tenant.use-case';
import { UpdateTenantUseCase } from '../../application/use-cases/update-tenant.use-case';
import { GetTenantBrandingUseCase } from '../../application/use-cases/get-tenant-branding.use-case';

@ApiTags('Clínicas')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly getTenant: GetTenantUseCase,
    private readonly updateTenant: UpdateTenantUseCase,
    private readonly getTenantBranding: GetTenantBrandingUseCase,
  ) {}

  @Get('branding/:subdomain')
  @ApiOperation({
    summary:
      'Identidade visual pública da clínica (logo e cores para a tela de login)',
  })
  async branding(@Param('subdomain') subdomain: string) {
    return this.getTenantBranding.execute(subdomain);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiOperation({ summary: 'Dados da clínica autenticada' })
  async me(@Tenant('tenantId') tenantId: string) {
    return this.getTenant.execute(tenantId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualiza os dados e a identidade visual da clínica',
  })
  async update(
    @Tenant('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.updateTenant.execute(tenantId, dto);
  }
}
