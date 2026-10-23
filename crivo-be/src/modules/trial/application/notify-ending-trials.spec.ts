import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import {
  NOTIFY_DAYS_BEFORE,
  NotifyEndingTrialsUseCase,
} from './notify-ending-trials.use-case';

function makeUseCase(
  tenants: Array<{ name: string; users: { email: string }[] }>,
) {
  const prisma = {
    tenant: { findMany: jest.fn().mockResolvedValue(tenants) },
  } as unknown as PrismaService;

  const mail = {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailService;

  const config = {
    get: jest.fn().mockReturnValue('https://app.crivo.test'),
  } as unknown as ConfigService;

  return {
    useCase: new NotifyEndingTrialsUseCase(prisma, mail, config),
    prisma,
    mail,
  };
}

describe('NotifyEndingTrialsUseCase', () => {
  it('envia um aviso por clínica que está a 3 dias do fim', async () => {
    const { useCase, mail } = makeUseCase([
      { name: 'Clínica A', users: [{ email: 'a@teste.com' }] },
      { name: 'Clínica B', users: [{ email: 'b@teste.com' }] },
    ]);

    await expect(useCase.execute()).resolves.toBe(2);
    expect(mail.send).toHaveBeenCalledTimes(2);
    expect(mail.send).toHaveBeenCalledWith(
      'a@teste.com',
      expect.objectContaining({ subject: expect.stringContaining('teste') }),
    );
  });

  it('busca só quem está TRIALING, numa janela de UM dia', async () => {
    const { useCase, prisma } = makeUseCase([]);

    await useCase.execute();

    const where = (prisma.tenant.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.subscriptionStatus).toBe('TRIALING');

    // Sem a janela fechada (`gte` + `lt`), o mesmo tenant receberia o aviso
    // em toda execução diária até o trial vencer.
    const dias =
      (where.trialEndsAt.lt.getTime() - where.trialEndsAt.gte.getTime()) /
      86_400_000;
    expect(dias).toBe(1);

    const faltam = Math.round(
      (where.trialEndsAt.gte.getTime() - new Date().setHours(0, 0, 0, 0)) /
        86_400_000,
    );
    expect(faltam).toBe(NOTIFY_DAYS_BEFORE);
  });

  it('clínica sem admin ativo não quebra o lote', async () => {
    const { useCase, mail } = makeUseCase([
      { name: 'Sem admin', users: [] },
      { name: 'Com admin', users: [{ email: 'ok@teste.com' }] },
    ]);

    // A primeira é pulada, a segunda é enviada — um tenant sem destinatário
    // não pode impedir o aviso das outras.
    await expect(useCase.execute()).resolves.toBe(1);
    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(mail.send).toHaveBeenCalledWith('ok@teste.com', expect.anything());
  });
});
