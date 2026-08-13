/**
 * Quantos dias inteiros ainda faltam para o trial acabar.
 *
 * **`floor`, não `ceil`.** Com `ceil`, um trial de 14 dias recém-criado
 * mostrava "15 dias restantes" — prometia um dia a mais do que o produto
 * entrega — e o contador ficava travado em "14" durante as primeiras 24h,
 * então quem assinou ontem via o mesmo número de hoje (bug relatado em
 * 13/08/2026).
 *
 * `floor` responde à pergunta que a clínica realmente faz: "quantos dias
 * inteiros eu ainda tenho?". Assinou hoje às 15h num trial de 14 dias → vê
 * 14; amanhã ao meio-dia → vê 13.
 *
 * O troco (as horas quebradas) fica a favor do cliente: quem vê "0 dias"
 * ainda tem até o horário exato de `trialEndsAt` para assinar, e o
 * `SubscriptionGuard` no backend é quem de fato corta o acesso — nunca este
 * número.
 *
 * Fonte única: duas cópias desta conta (banner e tela de Assinatura) já
 * tinham divergido uma vez.
 */
export function trialDaysLeft(endsAtIso: string): number {
  const diffMs = new Date(endsAtIso).getTime() - Date.now();
  return Math.max(Math.floor(diffMs / 86_400_000), 0);
}
