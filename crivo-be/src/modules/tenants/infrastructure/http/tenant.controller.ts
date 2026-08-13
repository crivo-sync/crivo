import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from 'src/shared/decorators/roles.decorator';
import { assertValidImageUpload } from 'src/shared/validation/image-upload';
import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { GetTenantUseCase } from '../../application/use-cases/get-tenant.use-case';
import { UpdateTenantUseCase } from '../../application/use-cases/update-tenant.use-case';
import { GetTenantBrandingUseCase } from '../../application/use-cases/get-tenant-branding.use-case';
import { UpdateTenantLogoUseCase } from '../../application/use-cases/update-tenant-logo.use-case';
import { GetOnboardingStatusUseCase } from '../../application/use-cases/get-onboarding-status.use-case';

@ApiTags('Clínicas')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly getTenant: GetTenantUseCase,
    private readonly updateTenant: UpdateTenantUseCase,
    private readonly getTenantBranding: GetTenantBrandingUseCase,
    private readonly updateTenantLogo: UpdateTenantLogoUseCase,
    private readonly getOnboardingStatus: GetOnboardingStatusUseCase,
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
  // Sem TrialGuard de propósito: é daqui que o painel lê `trialEndsAt` para
  // avisar a clínica. Bloquear esta rota também deixaria quem já expirou
  // sem forma de descobrir por quê.
  async me(@Tenant('tenantId') tenantId: string) {
    return this.getTenant.execute(tenantId);
  }

  @Get('me/onboarding')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiOperation({
    summary: 'O que ainda falta para a clínica começar a operar',
  })
  // Mesmos guards de `GET me`, pelo mesmo motivo e mais um: sem `TrialGuard`,
  // quem venceu o teste ainda vê o que falta; sem `PlanFeatureGuard`, o Solo
  // também vê — é justamente o plano de entrada que mais precisa disso, e o
  // painel com gráficos (que traria esses números de graça) é pago.
  //
  // Registrado ANTES de `@Patch('me')` não importa (métodos HTTP diferentes),
  // mas fica junto de `me` por ser a mesma família de rota.
  async onboarding(@Tenant('tenantId') tenantId: string) {
    return this.getOnboardingStatus.execute(tenantId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, TrialGuard)
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

  @Post('me/logo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, TrialGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Envia/troca o logo da clínica (JPEG, PNG ou WebP, até 5MB)',
  })
  async uploadLogo(
    @Tenant('tenantId') tenantId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    assertValidImageUpload(file);

    return this.updateTenantLogo.execute({
      tenantId,
      fileBuffer: file.buffer,
    });
  }
}
