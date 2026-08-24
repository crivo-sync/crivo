import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { MailService } from 'src/modules/mail/application/mail.service';
import { welcomeMail } from 'src/modules/mail/application/templates';

export type RegisterInput = {
  tenantName: string;
  subdomain: string;
  name: string;
  email: string;
  /** WhatsApp da clínica, só dígitos. É por onde o Crivo Sync fala com ela. */
  phone: string;
  password: string;
  /**
   * Plano que a clínica pretende assinar. **Não cobra nada** — o trial segue
   * sendo 14 dias sem cartão. Serve para o teto do plano já valer durante o
   * teste.
   *
   * Opcional: quem chega pelo "Comece grátis" sem passar pela tabela de
   * preços não é obrigado a decidir agora, e cai no teto do maior plano
   * (`resolveTrialProfessionalLimit`), como antes.
   */
  planKey?: string;
};

const SALT_ROUNDS = 10;

/// Único plano hoje: 14 dias de trial, sem cartão. Planos pagos e preço
/// entram depois, manualmente, quando o Stripe estiver configurado.
const TRIAL_DAYS = 14;

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: RegisterInput) {
    const [existingTenant, existingUser] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { subdomain: input.subdomain },
      }),
      this.prisma.user.findUnique({ where: { email: input.email } }),
    ]);

    if (existingTenant) {
      throw new ConflictException('Subdomain already in use.');
    }

    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    /**
     * O plano escolhido no cadastro já vale **durante o trial** — sem
     * cobrança, só como teto.
     *
     * É o que impede o problema que existia na virada: o trial liberava até
     * 8 profissionais, a clínica cadastrava a equipe toda, assinava o Solo
     * (1 incluído) e caía num estado de excedente que alguém tinha que
     * resolver desativando gente. Com o teto valendo desde o começo, ela vê
     * "seu plano permite 1" no 2º cadastro — no dia 1 do teste, quando
     * trocar de plano ainda é uma decisão barata, e não depois de pagar.
     *
     * `subscriptionStatus` segue `TRIALING` (o default): plano definido não
     * é assinatura ativa, e `TrialGuard` continua contando os 14 dias.
     */
    const plan = input.planKey
      ? await this.prisma.plan.findFirst({
          where: { key: input.planKey, isActive: true },
          select: { id: true },
        })
      : null;

    const created = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          subdomain: input.subdomain,
          phone: input.phone,
          trialEndsAt,
          // Plano inexistente/inativo é ignorado em vez de derrubar o
          // cadastro: perder uma conta nova por causa de uma `planKey`
          // errada na URL seria o pior desfecho possível aqui.
          ...(plan ? { planId: plan.id } : {}),
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      return { tenant, user };
    });

    // Fora da transação de propósito: mandar e-mail é chamada de rede
    // externa, e segurar uma conexão do banco esperando SMTP é o tipo de
    // coisa que derruba o pool sob carga. `MailService.send` nunca lança —
    // falha de e-mail não pode impedir a criação da conta.
    const appUrl =
      this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3000';

    await this.mail.send(
      created.user.email,
      welcomeMail({
        clinicName: created.tenant.name,
        bookingUrl: `${appUrl.replace(/\/$/, '')}/agendar/${created.tenant.subdomain}`,
        trialDays: TRIAL_DAYS,
      }),
    );

    return created;
  }
}
