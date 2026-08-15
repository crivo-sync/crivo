/**
 * Sincroniza o estado das assinaturas **do Stripe para o banco**.
 *
 * O webhook é o caminho normal, mas em desenvolvimento ele depende do
 * `stripe listen`, que abre um WebSocket na porta 7844 — bloqueada em
 * algumas redes (foi o caso em 13/08/2026, junto com o cloudflared). Quando
 * isso acontece o pagamento é processado no Stripe e o banco nunca fica
 * sabendo: a clínica paga e continua vendo "período de teste".
 *
 * Este script fecha essa lacuna lendo a fonte da verdade — o Stripe — e
 * ajustando o banco. Também serve em produção, para reparar divergência
 * causada por webhook perdido.
 *
 * Uso:
 *   npm run stripe:pull           # mostra o que faria, sem gravar
 *   npm run stripe:pull -- --write  # aplica
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

// Prisma v7 exige driver adapter — mesmo padrão do `seed.ts`.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Mesmo mapeamento do webhook — se divergir, os dois caminhos discordam. */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
    case 'unpaid':
      return SubscriptionStatus.PAST_DUE;
    default:
      return SubscriptionStatus.CANCELED;
  }
}

async function main() {
  const write = process.argv.includes('--write');
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    console.error('STRIPE_SECRET_KEY não configurada.');
    process.exit(1);
  }

  const stripe = new Stripe(secret);

  const tenants = await prisma.tenant.findMany({
    where: { stripeCustomerId: { not: null } },
    select: {
      id: true,
      name: true,
      subdomain: true,
      planId: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
    },
  });

  const plans = await prisma.plan.findMany({
    select: { id: true, name: true, stripePriceId: true },
  });
  const planByPrice = new Map(
    plans.filter((p) => p.stripePriceId).map((p) => [p.stripePriceId!, p]),
  );

  console.log(
    `\n${tenants.length} clínica(s) com cliente no Stripe.${
      write ? '' : ' (simulação — use --write para aplicar)'
    }\n`,
  );

  let ajustes = 0;

  for (const tenant of tenants) {
    const subs = await stripe.subscriptions.list({
      customer: tenant.stripeCustomerId!,
      status: 'all',
      limit: 20,
    });

    const ativas = subs.data.filter(
      (s) => s.status === 'active' || s.status === 'trialing',
    );

    /**
     * Mais de uma assinatura ativa é cobrança duplicada — o bug de troca de
     * plano gerava isso. O script **avisa mas não cancela**: escolher qual
     * morre é decisão de dinheiro do cliente, não de um script.
     */
    if (ativas.length > 1) {
      console.log(
        `⚠️  ${tenant.subdomain}: ${ativas.length} assinaturas ATIVAS ao mesmo tempo —`,
        ativas.map((s) => `${s.id} (R$ ${(s.items.data[0]?.price?.unit_amount ?? 0) / 100})`).join(', '),
      );
      console.log(
        '    Cancele as excedentes no dashboard do Stripe antes de sincronizar.',
      );
    }

    // A mais recente é a que vale: é a última que o cliente contratou.
    const atual = ativas.sort((a, b) => b.created - a.created)[0];

    if (!atual) {
      // Sem assinatura ativa: só marca CANCELED quem já teve uma. Trial que
      // nunca assinou não deve virar cancelado.
      if (tenant.stripeSubscriptionId && tenant.subscriptionStatus !== 'CANCELED') {
        console.log(`• ${tenant.subdomain}: sem assinatura ativa → CANCELED`);
        ajustes += 1;
        if (write) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { subscriptionStatus: SubscriptionStatus.CANCELED },
          });
        }
      }
      continue;
    }

    const priceId = atual.items.data[0]?.price?.id;
    const plan = priceId ? planByPrice.get(priceId) : undefined;
    const status = mapStatus(atual.status);

    const precisaAjuste =
      tenant.stripeSubscriptionId !== atual.id ||
      tenant.subscriptionStatus !== status ||
      (plan && tenant.planId !== plan.id);

    if (!precisaAjuste) continue;

    if (!plan) {
      console.log(
        `⚠️  ${tenant.subdomain}: price ${priceId} não bate com nenhum plano do banco — pulando.`,
      );
      continue;
    }

    console.log(
      `• ${tenant.subdomain}: ${tenant.subscriptionStatus} → ${status}, plano → ${plan.name}`,
    );
    ajustes += 1;

    if (write) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          planId: plan.id,
          stripeSubscriptionId: atual.id,
          subscriptionStatus: status,
        },
      });
    }
  }

  console.log(
    ajustes === 0
      ? '\nTudo sincronizado.\n'
      : `\n${ajustes} ajuste(s) ${write ? 'aplicado(s)' : 'pendente(s) — rode com --write'}.\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
