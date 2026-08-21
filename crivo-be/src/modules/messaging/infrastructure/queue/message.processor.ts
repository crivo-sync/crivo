import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { Job } from 'bullmq';

import { MessageProviderResolver } from '../../application/services/message-provider-resolver.service';
import { CheckMessageQuotaUseCase } from '../../application/use-cases/check-message-quota.use-case';
import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repository/message.repository';
import {
  BACKOFF_BASE_MS,
  MESSAGING_QUEUE,
  SendMessageJob,
  SendMessageJobResult,
} from './messaging.queue';

@Processor(MESSAGING_QUEUE)
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    // Resolvido por mensagem, não injetado fixo: cada clínica pode estar num
    // provider diferente, e a escolha muda em runtime pela tela de
    // Configurações — um provider injetado no boot ficaria congelado.
    private readonly providerResolver: MessageProviderResolver,
    private readonly checkQuota: CheckMessageQuotaUseCase,
  ) {
    super();
  }

  /**
   * O retorno vira o `returnValue` do job no Bull Board. Não é usado por
   * nenhum código — existe só para o painel mostrar *o que aconteceu* em vez
   * de `null`: qual provider tratou, para quem foi e o id no provider (o
   * mesmo que concilia status de entrega depois).
   */
  async process(job: Job<SendMessageJob>): Promise<SendMessageJobResult> {
    const attempt = job.attemptsMade + 1;
    const total = job.opts.attempts ?? 1;

    const message = await this.messageRepository.findById(job.data.messageId);

    if (!message) {
      await this.trace(job, `Mensagem ${job.data.messageId} não existe mais.`);
      this.logger.warn(`Mensagem ${job.data.messageId} não existe mais.`);
      return { outcome: 'skipped', reason: 'mensagem não existe mais' };
    }

    // Resolvido pelo tenant da mensagem: o job só sabe o `messageId`, e cada
    // clínica tem o **seu** caminho (provider) e o **seu** número (sender).
    // Errar o segundo faria o paciente receber pelo WhatsApp de outra clínica.
    const { provider, sender } = await this.providerResolver.resolveForTenant(
      message.tenantId,
    );

    // Contexto de negócio no log do job: quem é o paciente e de qual
    // atendimento. Sem isso o dev só vê um uuid e precisa ir ao banco.
    await this.trace(
      job,
      [
        `tentativa ${attempt}/${total}`,
        `tipo=${message.type}`,
        `paciente=${message.patient?.name ?? message.appointment?.patient.name ?? '—'}`,
        `telefone=${message.toPhone}`,
        `atendimento=${message.appointmentId ?? '—'}`,
        `provider=${provider.name}`,
      ].join(' · '),
    );

    // Já enviada: evita duplicar se o job for reprocessado.
    if (message.sentAt) {
      await this.trace(
        job,
        `Ignorada: já enviada em ${message.sentAt.toISOString()}.`,
      );
      return { outcome: 'skipped', reason: 'já enviada' };
    }

    // Remarcaram o agendamento: o texto desta mensagem tem a data antiga.
    // A remoção da fila é best-effort, então esta guarda é o que de fato
    // impede o paciente de receber a informação errada.
    if (message.status === MessageStatus.CANCELLED) {
      await this.trace(
        job,
        'Ignorada: agendamento foi remarcado, este texto tem a data antiga.',
      );
      return { outcome: 'skipped', reason: 'cancelada por reagendamento' };
    }

    // Franquia do mês estourada. Falha (e não "skip") de propósito: a
    // mensagem aparece na lista de falhas, que é a tela onde a recepção vê
    // quem precisa de ligação. Sumir em silêncio deixaria o paciente sem
    // aviso e a clínica sem saber.
    const quota = await this.checkQuota.execute(message.tenantId);
    if (!quota.allowed) {
      // `limit: 0` é o sentinela de conta fechada (trial vencido ou
      // assinatura cancelada) — a mensagem precisa dizer isso, não que a
      // franquia do mês acabou.
      const motivo =
        quota.limit === 0
          ? 'Sua assinatura foi cancelada ou o período de teste terminou. As mensagens não são mais enviadas.'
          : quota.isTrial
            ? `Franquia do teste esgotada (${quota.used}/${quota.limit} mensagens). Escolha um plano em Configurações → Assinatura para continuar enviando.`
            : `Franquia do plano esgotada (${quota.used}/${quota.limit} mensagens neste mês). Faça upgrade em Configurações → Assinatura.`;

      await this.messageRepository.markFailed(message.id, motivo);
      await this.trace(job, `Bloqueada: ${motivo}`);
      return { outcome: 'skipped', reason: 'franquia esgotada' };
    }

    await this.messageRepository.incrementAttempts(message.id);

    const startedAt = Date.now();
    const result = await provider.send({
      toPhone: message.toPhone,
      body: message.body,
      sender,
    });
    const elapsed = Date.now() - startedAt;

    await this.messageRepository.markSent(message.id, {
      provider: provider.name,
      providerMessageId: result.providerMessageId,
    });

    await this.trace(
      job,
      `Enviada em ${elapsed}ms · providerMessageId=${result.providerMessageId ?? '—'}`,
    );

    this.logger.log(
      `[${provider.name}] ${message.type} → ${message.toPhone} (${elapsed}ms)`,
    );

    return {
      outcome: 'sent',
      provider: provider.name,
      toPhone: message.toPhone,
      type: message.type,
      providerMessageId: result.providerMessageId ?? null,
    };
  }

  /**
   * Só marca FAILED quando o BullMQ esgotou as tentativas — antes disso o job
   * ainda vai ser retentado e a mensagem segue PENDING.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<SendMessageJob>, error: Error): Promise<void> {
    const total = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= total;

    if (!isLastAttempt) {
      // Quanto o BullMQ vai esperar até a próxima — sem isso o dev não sabe
      // se espera 30s ou 2min antes de investigar.
      const nextInMs = Math.round(
        Math.pow(2, job.attemptsMade - 1) * BACKOFF_BASE_MS,
      );

      await this.trace(
        job,
        `FALHOU (${job.attemptsMade}/${total}) — nova tentativa em ${nextInMs / 1000}s · ${error.message}`,
      );
      this.logger.warn(
        `Envio falhou (tentativa ${job.attemptsMade}/${total}), retenta em ${nextInMs / 1000}s: ${error.message}`,
      );
      return;
    }

    // Última tentativa: aqui a recepção vira responsável por ligar, então o
    // log precisa dizer PARA QUEM, não só o id da mensagem.
    const message = await this.messageRepository.findById(job.data.messageId);
    const who =
      message?.patient?.name ??
      message?.appointment?.patient.name ??
      'paciente desconhecido';
    const phone = message?.toPhone ?? '—';

    await this.trace(
      job,
      `DESISTIU após ${total} tentativas · ${who} (${phone}) precisa de ligação · ${error.message}`,
    );
    this.logger.error(
      `Envio falhou definitivamente: ${who} (${phone}) — mensagem ${job.data.messageId} · ${error.message}`,
    );

    await this.messageRepository.markFailed(job.data.messageId, error.message);
  }

  /**
   * Escreve na aba **Logs** do job no Bull Board. É o lugar onde o dev olha
   * primeiro quando algo deu errado — sem isso a aba fica vazia e resta só o
   * stack trace cru na aba Error.
   *
   * Nunca pode derrubar o envio: se o Redis recusar a escrita do log, o job
   * segue normalmente.
   */
  private async trace(job: Job<SendMessageJob>, line: string): Promise<void> {
    try {
      await job.log(`[${new Date().toISOString()}] ${line}`);
    } catch {
      // log é diagnóstico, não pode virar causa de falha de envio
    }
  }
}
