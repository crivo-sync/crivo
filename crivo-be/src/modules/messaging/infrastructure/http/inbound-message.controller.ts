import {
  Controller,
  Get,
  Param,
  Patch,
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
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { GetInboundMessagesUseCase } from '../../application/use-cases/get-inbound-messages.use-case';
import { InboundMessageResponseDto } from '../dtos/inbound-message-response.dto';
import { QueryInboundMessagesDto } from '../dtos/query-inbound-messages.dto';

/**
 * Caixa de entrada: o que o paciente respondeu.
 *
 * Sem `@Roles`: atender o paciente é trabalho da recepção (`STAFF`), então
 * restringir a ADMIN esvaziaria a função da tela.
 */
@ApiTags('Mensagens recebidas')
@ApiBearerAuth()
@Controller('inbound-messages')
@UseGuards(JwtAuthGuard, TenantContextGuard, TrialGuard)
export class InboundMessageController {
  constructor(private readonly getInbound: GetInboundMessagesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Mensagens recebidas dos pacientes' })
  @ApiOkResponse({ type: [InboundMessageResponseDto] })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryInboundMessagesDto,
  ) {
    const { data, total, unreadTotal } = await this.getInbound.execute({
      tenantId,
      unreadOnly: query.unreadOnly,
      intent: query.intent,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      ...paginated(data.map(InboundMessageResponseDto.fromEntity), {
        page: query.page,
        perPage: query.perPage,
        total,
      }),
      // Fora do `meta` da paginação de propósito: conta o tenant inteiro, não
      // a página nem o filtro — é o número do badge no menu.
      unreadTotal,
    };
  }

  // `read-all` ANTES de `:id/read`: o Nest casa rota por ordem de registro,
  // não por especificidade. Invertido, `read-all` nunca seria alcançado — é
  // a mesma armadilha já documentada em `MeController` (`/users/me` vs
  // `/users/:id`).
  @Patch('read-all')
  @ApiOperation({ summary: 'Marca todas as recebidas como tratadas' })
  async markAllAsRead(@Tenant('tenantId') tenantId: string) {
    const count = await this.getInbound.markAllAsRead(tenantId);

    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca uma mensagem como tratada' })
  async markAsRead(
    @Tenant('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const message = await this.getInbound.markAsRead(id, tenantId);

    return InboundMessageResponseDto.fromEntity({
      ...message,
      patient: null,
      appointment: null,
    });
  }
}
