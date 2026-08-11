import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Tenant } from 'src/shared/decorators/current-tenant.decorator';
import { paginated } from 'src/shared/dtos/paginated-response.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/shared/tenant-context/tenant-context.guard';
import { TrialGuard } from 'src/shared/guards/trial.guard';
import { QueryMessagesDto } from '../dtos/query-messages.dto';
import { MessageResponseDto } from '../dtos/message-response.dto';
import { GetMessagesUseCase } from '../../application/use-cases/get-messages.use-case';
import { ResendMessageUseCase } from '../../application/use-cases/resend-message.use-case';

@ApiTags('Mensagens')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, TenantContextGuard, TrialGuard)
export class MessageController {
  constructor(
    private readonly getMessages: GetMessagesUseCase,
    private readonly resendMessage: ResendMessageUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de mensagens enviadas pela clínica' })
  @ApiOkResponse({ type: [MessageResponseDto] })
  async findAll(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryMessagesDto,
  ) {
    const { data, total } = await this.getMessages.execute({
      tenantId,
      status: query.status,
      from: query.from,
      to: query.to,
      page: query.page,
      perPage: query.perPage,
    });

    return paginated(data.map(MessageResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  @Get('failed')
  @ApiOperation({
    summary:
      'Pacientes que NÃO receberam a mensagem — lista para a recepção ligar',
  })
  @ApiOkResponse({ type: [MessageResponseDto] })
  async findFailed(
    @Tenant('tenantId') tenantId: string,
    @Query() query: QueryMessagesDto,
  ) {
    const { data, total } = await this.getMessages.getFailed(
      tenantId,
      query.page,
      query.perPage,
    );

    return paginated(data.map(MessageResponseDto.fromEntity), {
      page: query.page,
      perPage: query.perPage,
      total,
    });
  }

  @Post(':id/resend')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Reenvia uma mensagem que falhou — devolve à fila com as tentativas zeradas',
  })
  @ApiNoContentResponse()
  async resend(
    @Tenant('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.resendMessage.execute(id, tenantId);
  }
}
