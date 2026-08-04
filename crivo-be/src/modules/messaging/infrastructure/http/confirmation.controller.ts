import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConfirmByTokenUseCase } from '../../application/use-cases/confirm-by-token.use-case';

/**
 * Rota pública — é o link que o paciente recebe no WhatsApp. Sem guard de
 * propósito: o token opaco do agendamento é a única credencial necessária.
 *
 * O caminho é curto (`/c/:token`) porque vai dentro de uma mensagem.
 */
@ApiTags('Confirmação pública')
@Controller('c')
export class ConfirmationController {
  constructor(private readonly confirmByToken: ConfirmByTokenUseCase) {}

  @Get(':token')
  @ApiOperation({
    summary:
      'Detalhes do agendamento a confirmar (abre ao tocar no link) — só leitura, não confirma',
  })
  async show(@Param('token') token: string) {
    const { appointment, alreadyConfirmed } =
      await this.confirmByToken.preview(token);

    return {
      alreadyConfirmed,
      clinic: appointment.tenant.name,
      patient: appointment.patient.name,
      professional: appointment.professional.name,
      procedure: appointment.procedure.name,
      startsAt: appointment.startsAt,
      status: appointment.status,
    };
  }

  @Post(':token/confirm')
  @ApiOperation({
    summary: 'Confirma a presença (única rota que muda o status)',
  })
  async confirm(@Param('token') token: string) {
    const { appointment, alreadyConfirmed } =
      await this.confirmByToken.execute(token);

    return { alreadyConfirmed, status: appointment.status };
  }
}
