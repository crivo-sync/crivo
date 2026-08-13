import { renderMail, type MailContent } from './layout';

export type RenderedMail = { subject: string; html: string; text: string };

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const build = (subject: string, content: MailContent): RenderedMail => ({
  subject,
  ...renderMail(content),
});

/**
 * Boas-vindas, logo após o cadastro.
 *
 * Aproveita o momento de maior atenção para entregar o **link do `/agendar`**
 * — que é o que a clínica vai divulgar — e dizer o que falta configurar. É o
 * mesmo conteúdo do checklist do painel, para quem fechou a aba antes de ver.
 */
export function welcomeMail(input: {
  clinicName: string;
  bookingUrl: string;
  trialDays: number;
}): RenderedMail {
  return build(`Bem-vindo ao Crivo, ${input.clinicName}`, {
    heading: 'Sua conta está pronta',
    intro: [
      `A ${input.clinicName} já pode usar o Crivo. Você tem ${input.trialDays} dias de teste, sem cartão.`,
      'Para a agenda funcionar, faltam dois cadastros rápidos: quem atende e quais procedimentos a clínica faz. Sem os dois, o link de agendamento ainda não aceita marcação.',
    ],
    rows: [{ label: 'Seu link de agendamento', value: input.bookingUrl }],
    cta: { label: 'Configurar minha clínica', url: input.bookingUrl },
    outro: [
      'Depois de cadastrar profissional e procedimento, é só divulgar esse link: o paciente marca sozinho, sem baixar app.',
    ],
  });
}

/** Confirmação de assinatura — disparada quando o Stripe confirma o pagamento. */
export function subscriptionConfirmedMail(input: {
  clinicName: string;
  planName: string;
  priceInCents: number;
  /** Quando a próxima cobrança acontece; ausente se o Stripe não informou. */
  nextChargeAt?: Date | null;
  messageQuota: number | null;
  maxProfessionals: number | null;
}): RenderedMail {
  const rows = [
    { label: 'Plano', value: input.planName },
    { label: 'Valor', value: `${brl(input.priceInCents)} por mês` },
    {
      label: 'Profissionais',
      value:
        input.maxProfessionals === null
          ? 'Ilimitados'
          : `Até ${input.maxProfessionals}`,
    },
    {
      label: 'Mensagens por mês',
      value:
        input.messageQuota === null
          ? 'Sem limite'
          : `${input.messageQuota} mensagens`,
    },
  ];

  if (input.nextChargeAt) {
    rows.push({
      label: 'Próxima cobrança',
      value: new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(input.nextChargeAt),
    });
  }

  return build(`Assinatura confirmada — plano ${input.planName}`, {
    heading: 'Pagamento confirmado',
    intro: [
      `A assinatura da ${input.clinicName} está ativa. O acesso ao painel continua sem interrupção.`,
    ],
    rows,
    outro: [
      'A cobrança é mensal e renova sozinha. Para trocar de plano ou cancelar, use Configurações → Assinatura no painel.',
    ],
  });
}

/**
 * Aviso de trial acabando.
 *
 * Existe porque o aviso de vencimento só aparecia **dentro do painel** — quem
 * parou de entrar não ficava sabendo que ia perder o acesso, e descobria com
 * a agenda travada.
 */
export function trialEndingMail(input: {
  clinicName: string;
  daysLeft: number;
  plansUrl: string;
}): RenderedMail {
  const prazo =
    input.daysLeft <= 0
      ? 'acaba hoje'
      : input.daysLeft === 1
        ? 'acaba amanhã'
        : `acaba em ${input.daysLeft} dias`;

  return build(`Seu teste do Crivo ${prazo}`, {
    heading: `O teste ${prazo}`,
    intro: [
      `O período de teste da ${input.clinicName} está terminando.`,
      'Depois disso o acesso ao painel fica bloqueado até a escolha de um plano — os dados da clínica continuam salvos, nada é apagado.',
    ],
    cta: { label: 'Escolher um plano', url: input.plansUrl },
    outro: [
      'Os lembretes automáticos param junto com o acesso. Se a agenda tem consulta marcada para os próximos dias, vale resolver antes.',
    ],
  });
}

/**
 * Falha de cobrança. O Stripe ainda vai tentar de novo — por isso o texto
 * fala em "atualizar o cartão", não em "acesso cortado": cortar na primeira
 * falha seria punir quem só trocou de cartão.
 */
export function paymentFailedMail(input: {
  clinicName: string;
  planName: string;
  billingUrl: string;
}): RenderedMail {
  return build('Não conseguimos processar seu pagamento', {
    heading: 'Falha na cobrança',
    intro: [
      `A cobrança do plano ${input.planName} da ${input.clinicName} não foi aprovada.`,
      'Vamos tentar de novo automaticamente nos próximos dias. Atualizar a forma de pagamento agora evita qualquer interrupção.',
    ],
    cta: { label: 'Atualizar pagamento', url: input.billingUrl },
    outro: [
      'Se o cartão já foi trocado, pode ignorar este aviso — a próxima tentativa vai passar.',
    ],
  });
}
