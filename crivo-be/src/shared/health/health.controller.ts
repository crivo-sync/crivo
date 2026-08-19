import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { PrismaService } from '../infrastructure/prisma/prisma.service';

/**
 * Healthcheck para a plataforma de deploy (Railway, Render, Fly…).
 *
 * **Sem guard de propósito** — quem chama é o orquestrador, que não tem
 * token. Por isso também não devolve nada além de "está de pé": versão,
 * uptime ou nome de serviço em rota pública só ajudam quem está sondando.
 *
 * Confere o **banco**, não só o processo: uma API que responde mas perdeu a
 * conexão com o Postgres está inútil para a clínica, e é justamente o caso
 * que o orquestrador precisa detectar para reiniciar/parar o rollout. O
 * `SELECT 1` é a consulta mais barata que prova que o pool está vivo.
 */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return { status: 'ok' };
  }
}
