import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import basicAuth from 'express-basic-auth';

const logger = new Logger('BullBoard');

/**
 * O Bull Board mostra dado real de paciente (telefone, corpo da mensagem)
 * dentro do payload de cada job — não é só "estado da fila", é PII. Por
 * isso, ao contrário do Swagger (`/docs`, sem proteção), ele só fica de pé
 * se `BULL_BOARD_USER`/`BULL_BOARD_PASSWORD` estiverem configurados; sem
 * isso, nega tudo por padrão em vez de expor sem querer.
 */
export function createBullBoardAuthMiddleware(config: ConfigService) {
  const user = config.get<string>('BULL_BOARD_USER');
  const password = config.get<string>('BULL_BOARD_PASSWORD');

  if (!user || !password) {
    logger.warn(
      'BULL_BOARD_USER/BULL_BOARD_PASSWORD não configurados — painel em /admin/queues fica bloqueado.',
    );
    return (_req: Request, res: Response, _next: NextFunction) => {
      res.status(404).send('Not Found');
    };
  }

  return basicAuth({ users: { [user]: password }, challenge: true });
}
