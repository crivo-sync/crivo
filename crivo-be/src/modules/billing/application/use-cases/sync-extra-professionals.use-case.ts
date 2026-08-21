import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';

/**
 * Sincroniza, no Stripe, quantos profissionais **além** dos incluídos no
 * plano a clínica está pagando.
 *
 * A quantidade nunca é incrementada/decrementada "+1"/"-1": é sempre
 * **recalculada do zero** a partir da contagem real de profissionais ativos
 * contra o teto do plano atual. Um contador incremental duplicaria a conta
 * que o banco já sabe fazer, e divergiria dela na primeira falha de rede —
 * cadastrar, o Stripe falhar, tentar de novo, e o contador ficar um a mais
 * do que a assinatura de verdade.
 *
 * Chamada nos três pontos em que a equipe ou o plano mudam:
 * - `CreateProfessionalUseCase` — depois de cadastrar
 * - `DeleteProfessionalUseCase` — depois de remover
 * - `HandleStripeWebhookUseCase` — depois de um upgrade/downgrade de plano,
 *   porque a troca de assinatura no Stripe não carrega os itens da anterior
 */
@Injectable()
export class SyncExtraProfessionalsUseCase {
  private readonly logger = new Logger(SyncExtraProfessionalsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  /**
   * Silencioso de propósito: nenhum dos três chamadores deveria falhar por
   * causa do Stripe estar fora do ar. Um profissional cadastrado é dado real
   * no banco; a cobrança do adicional que não sincronizou fica logada como
   * erro para reparo manual (o mesmo padrão do cancelamento de assinatura
   * anterior em `HandleStripeWebhookUseCase`).
   */
  async execute(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        plan: {
          select: {
            maxProfessionals: true,
            stripeExtraProfessionalPriceId: true,
          },
        },
      },
    });

    // Trial (sem `planId`) ou assinatura ainda não confirmada: não há
    // assinatura Stripe para sincronizar. O trial libera o produto inteiro
    // sem cobrar nada — ver `CreateProfessionalUseCase.assertWithinPlanLimit`.
    if (!tenant?.plan || !tenant.stripeSubscriptionId) return;

    // Sem preço de adicional configurado, esta faixa não vende profissional
    // extra — nada para sincronizar (é o caso do plano de entrada, de 1).
    if (!tenant.plan.stripeExtraProfessionalPriceId) return;

    // Sem teto, "profissional além do incluído" não existe como conceito.
    if (tenant.plan.maxProfessionals === null) return;

    // Só profissional ATIVO ocupa vaga paga — desativado (`isActive: false`,
    // via "escolher quem fica"/teto) não deve ser cobrado. A contagem de
    // teto em `professional-limit.ts` filtra `isActive: true`; divergir aqui
    // criava cobrança de adicional para gente que a clínica já desativou.
    const activeCount = await this.prisma.professional.count({
      where: { tenantId, deletedAt: null, isActive: true },
    });

    const extraQuantity = Math.max(
      activeCount - tenant.plan.maxProfessionals,
      0,
    );

    try {
      await this.stripe.setExtraProfessionalsQuantity({
        subscriptionId: tenant.stripeSubscriptionId,
        extraPriceId: tenant.plan.stripeExtraProfessionalPriceId,
        quantity: extraQuantity,
      });
    } catch (error) {
      this.logger.error(
        `FALHA ao sincronizar profissionais adicionais do tenant ${tenantId} ` +
          `(esperado: ${extraQuantity}) — a cobrança pode estar desalinhada ` +
          `da equipe real: ${error}`,
      );
    }
  }
}
