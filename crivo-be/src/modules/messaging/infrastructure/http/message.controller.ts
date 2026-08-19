import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { SendManualMessageDto } from '../dtos/send-manual-message.dto';
import { ConversationEntryResponseDto } from '../dtos/conversation-entry-response.dto';
import { GetMessagesUseCase } from '../../application/use-cases/get-messages.use-case';
import { ResendMessageUseCase } from '../../application/use-cases/resend-message.use-case';
import { GetConversationUseCase } from '../../application/use-cases/get-conversation.use-case';
import { SendManualMessageUseCase } from '../../application/use-cases/send-manual-message.use-case';

@ApiTags('Mensagens')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, TenantContextGuard, TrialGuard)
export class MessageController {
  constructor(
    private readonly getMessages: GetMessagesUseCase,
    private readonly resendMessage: ResendMessageUseCase,
    private readonly getConversation: GetConversationUseCase,
    private readonly sendManualMessage: SendManualMessageUseCase,
  ) {}

  /**
   * Rota fixa antes de `:id/resend`: o Nest casa por ordem de registro, e
   * `conversation/:patientId` colidiria com o `:id` genérico se viesse depois.
   */
  @Get('conversation/:patientId')
  @ApiOperation({
    summary: 'Envio e recebimento de um paciente, juntos numa linha do tempo',
  })
  @ApiOkResponse({ type: [ConversationEntryResponseDto] })
  async conversation(
    @Tenant('tenantId') tenantId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    const entries = await this.getConversation.execute(tenantId, patientId);
    return entries.map(ConversationEntryResponseDto.fromEntry);
  }

  @Post('conversation/:patientId')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Resposta manual da recepção — entra na mesma fila dos envios automáticos',
  })
  @ApiNoContentResponse()
  async sendManual(
    @Tenant('tenantId') tenantId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: SendManualMessageDto,
  ): Promise<void> {
    await this.sendManualMessage.execute(tenantId, patientId, dto.body);
  }

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
