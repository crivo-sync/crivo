import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

/**
 * Teto de profissionais do trial = teto do **maior plano ativo**.
 *
 * Lido do banco em vez de constante: quando o catálogo mudar (plano novo,
 * teto revisado), o trial acompanha sozinho, sem ninguém lembrar de editar
 * um número aqui. `null` em qualquer plano ativo significa "existe plano sem
 * limite" — e aí o trial também não tem.
 *
 * Por que o trial tem teto: liberar tudo fazia a clínica cadastrar 10
 * profissionais no teste e descobrir na assinatura que o plano comporta 1.
 * Com o teto do maior plano, o trial continua mostrando o produto inteiro
 * sem criar um buraco impossível de fechar bem no fim do teste.
 *
 * Vive aqui, e não dentro de um use case, porque **três lugares** precisam
 * da mesma resposta (cadastro, status de excedente e a tela de resolução).
 * Uma cópia divergente entre eles seria exatamente o tipo de bug que já
 * aconteceu com o limite de profissionais.
 */
export async function resolveTrialProfessionalLimit(
  prisma: PrismaService,
): Promise<number | null> {
  const planos = await prisma.plan.findMany({
    where: { isActive: true },
    select: { maxProfessionals: true },
  });

  if (planos.length === 0) return null;
  if (planos.some((plan) => plan.maxProfessionals === null)) return null;

  return Math.max(...planos.map((plan) => plan.maxProfessionals ?? 0));
}

/**
 * Quantos profissionais ocupam vaga hoje.
 *
 * Só **ativo e não removido** conta: desativar e remover liberam vaga de
 * verdade, senão a clínica ficaria travada num limite que já não reflete
 * quem de fato atende — e a tela de "escolha quem fica" não teria efeito
 * nenhum.
 */
export function countProfessionalsOccupyingSeat(
  prisma: PrismaService,
  tenantId: string,
): Promise<number> {
  return prisma.professional.count({
    where: { tenantId, deletedAt: null, isActive: true },
  });
}

/**
 * Mensagem para **quem trabalha na clínica** (painel): diz o motivo real e o
 * caminho para resolver, porque quem lê tem acesso às duas telas.
 */
export const OVER_LIMIT_BOOKING_MESSAGE =
  'Sua clínica tem mais profissionais ativos do que o plano permite. ' +
  'Abra Profissionais → "Escolher quem fica", ou faça upgrade em ' +
  'Configurações → Assinatura, para voltar a agendar.';

/**
 * Mensagem para o **paciente** (página pública `/agendar`).
 *
 * Nunca a de cima: o paciente não tem painel, não assina nada e não pode
 * fazer absolutamente nada sobre o plano da clínica. Mostrar "faça upgrade
 * em Configurações → Assinatura" para ele expõe pendência comercial da
 * clínica a um terceiro — é vazamento de informação interna, e ainda por
 * cima manda o paciente a um lugar onde ele não consegue entrar.
 *
 * Diz o que ele precisa saber (não deu, fale por telefone) sem inventar
 * motivo falso: "agenda indisponível" é verdade do ponto de vista dele.
 */
export const OVER_LIMIT_PUBLIC_BOOKING_MESSAGE =
  'A agenda online desta clínica está temporariamente indisponível. ' +
  'Entre em contato com a clínica para marcar sua consulta.';

/**
 * A clínica está acima do teto do plano?
 *
 * Existe porque o limite não pode valer **só no cadastro**: uma clínica que
 * veio do trial com 4 profissionais e assinou o Solo (1 incluído) seguia
 * operando com os 4 — agenda cheia, página pública marcando com todos — e o
 * plano não valia nada na prática. Achado com um tenant real nesse estado.
 *
 * Bloquear **agendamento novo** (e não desativar ninguém, nem esconder
 * profissional do dropdown) é o único ponto que faz o limite valer sem o
 * sistema escolher quem atende no lugar da clínica: a agenda que já existe
 * continua intacta, e a saída — escolher quem fica ou subir de plano — está
 * na mensagem.
 */
export async function isOverProfessionalLimit(
  prisma: PrismaService,
  tenantId: string,
): Promise<boolean> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { plan: { select: { maxProfessionals: true } } },
  });

  const limite = tenant.plan
    ? tenant.plan.maxProfessionals
    : await resolveTrialProfessionalLimit(prisma);

  if (limite === null) return false;

  const ativos = await countProfessionalsOccupyingSeat(prisma, tenantId);

  return ativos > limite;
}
