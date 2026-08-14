import { Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { ManageWhatsAppConnectionUseCase } from '../../application/use-cases/manage-whatsapp-connection.use-case';

/**
 * Conexão do WhatsApp da clínica (pareamento por QR code).
 *
 * `@Roles(ADMIN)`: define de qual número saem as mensagens em nome da
 * clínica, e desconectar interrompe todo lembrete. Não é decisão da recepção.
 *
 * O `tenantId` vem sempre do token (`@Tenant`), nunca do corpo ou da URL —
 * é o que garante que ninguém pareie ou derrube o WhatsApp de outra clínica.
 */
@ApiTags('Conexão do WhatsApp')
@ApiBearerAuth()
@Controller('whatsapp-connection')
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, TrialGuard)
@Roles(Role.ADMIN)
export class WhatsAppConnectionController {
  constructor(private readonly connection: ManageWhatsAppConnectionUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Estado atual da conexão (a tela consulta em laço com o QR na tela)',
  })
  async status(@Tenant('tenantId') tenantId: string) {
    return this.connection.getStatus(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Inicia o pareamento e devolve o QR code' })
  async connect(@Tenant('tenantId') tenantId: string) {
    return this.connection.connect(tenantId);
  }

  @Delete()
  @ApiOperation({ summary: 'Desconecta o número da clínica' })
  async disconnect(@Tenant('tenantId') tenantId: string) {
    return this.connection.disconnect(tenantId);
  }
}
