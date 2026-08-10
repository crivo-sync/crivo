import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { MessageType, Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { ManageTemplatesUseCase } from '../../application/use-cases/manage-templates.use-case';
import { TEMPLATE_PLACEHOLDERS } from '../../application/services/template-renderer';

export class SaveTemplateDto {
  @ApiProperty({ enum: MessageType })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiProperty({ description: 'Texto com marcadores como {{paciente}}' })
  @IsString()
  @MaxLength(1000)
  body!: string;

  @ApiProperty({ description: 'Desligado volta ao texto padrão do sistema' })
  @IsBoolean()
  isActive!: boolean;
}

/**
 * Textos das mensagens automáticas.
 *
 * `@Roles(ADMIN)`: o texto sai em nome da clínica para todos os pacientes —
 * é decisão de quem responde pela clínica, não da recepção.
 */
@ApiTags('Templates de mensagem')
@ApiBearerAuth()
@Controller('message-templates')
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MessageTemplateController {
  constructor(private readonly manageTemplates: ManageTemplatesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Textos das mensagens automáticas (com o padrão quando não há personalização)',
  })
  @ApiOkResponse()
  async findAll(@Tenant('tenantId') tenantId: string) {
    const templates = await this.manageTemplates.list(tenantId);

    return {
      templates,
      // A tela precisa listar o que pode ser usado; manter essa lista só no
      // frontend faria as duas pontas divergirem no primeiro marcador novo.
      placeholders: Object.entries(TEMPLATE_PLACEHOLDERS).map(
        ([name, description]) => ({ name, description }),
      ),
    };
  }

  @Put()
  @ApiOperation({ summary: 'Salva o texto de um tipo de mensagem' })
  async save(
    @Tenant('tenantId') tenantId: string,
    @Tenant('userId') userId: string,
    @Body() dto: SaveTemplateDto,
  ) {
    return this.manageTemplates.save({
      tenantId,
      type: dto.type,
      body: dto.body,
      isActive: dto.isActive,
      userId,
    });
  }
}
